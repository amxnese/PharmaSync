from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import generics, status
from rest_framework.views import APIView
from .models import Patient, Medicine, Inventory, Prescription, PrescriptionItem
from .serializers import *
from .permissions import IsDoctor, IsPharmacist
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import random
from django.core.cache import cache
from django.core.mail import send_mail
from django.contrib.auth.hashers import check_password
from django.db import models

class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # inject extra fields into the response
        data['role'] = self.user.role
        data['full_name'] = self.user.full_name
        return data

class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
    
@api_view(['GET'])
def home(request):
    return Response({"message": "Hello from Django"})


# --- Auth ---
class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# --- Patients (doctor only) ---
class PatientListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsDoctor]
    serializer_class = PatientSerializer
    queryset = Patient.objects.all()


# --- Medicines (both roles can read, pharmacist can write) ---
class MedicineListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicineSerializer
    queryset = Medicine.objects.all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsPharmacist()]
        return super().get_permissions()


# --- Inventory (pharmacist only for writes) ---
class InventoryListView(generics.ListAPIView):
    serializer_class = InventorySerializer
    queryset = Inventory.objects.select_related('medicine').all()


class InventoryUpdateView(generics.UpdateAPIView):
    permission_classes = [IsPharmacist]
    serializer_class = InventorySerializer
    queryset = Inventory.objects.all()


# --- Prescriptions (doctor only) ---
class PrescriptionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsDoctor]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        # doctor only sees their own prescriptions
        return Prescription.objects.filter(doctor=self.request.user).prefetch_related('items__medicine')

    def perform_create(self, serializer):
        # cancel any existing drafts for this patient before creating a new one
        Prescription.objects.filter(
            doctor=self.request.user,
            patient=serializer.validated_data['patient'],
            status='draft'
        ).delete()
        
        serializer.save(doctor=self.request.user)


class PrescriptionDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsDoctor]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        return Prescription.objects.filter(doctor=self.request.user)


# --- Prescription Items — this is where the alert logic lives ---
class PrescriptionItemCreateView(APIView):
    permission_classes = [IsDoctor]

    def post(self, request, prescription_id):
        # make sure the prescription belongs to this doctor
        try:
            prescription = Prescription.objects.get(id=prescription_id, doctor=request.user)
        except Prescription.DoesNotExist:
            return Response({'error': 'Prescription not found'}, status=404)

        if prescription.status == 'issued':
            return Response({'error': 'Cannot modify an issued prescription'}, status=400)

        serializer = PrescriptionItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        medicine = serializer.validated_data['medicine']

        # check inventory
        try:
            inventory = Inventory.objects.get(medicine=medicine)
            is_available = inventory.quantity > 0
        except Inventory.DoesNotExist:
            is_available = False

        # save with availability snapshot
        item = serializer.save(
            prescription=prescription,
            available_at_issue=is_available
        )

        return Response({
            'item': PrescriptionItemSerializer(item).data,
            'alert': not is_available  # frontend shows warning if True
        }, status=201)
    

# ===

# Prescriptions visible to pharmacist — only issued and dispensed, not drafts
class PharmacistPrescriptionListView(generics.ListAPIView):
    permission_classes = [IsPharmacist]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        queryset = Prescription.objects.exclude(status='draft') \
            .prefetch_related('items__medicine') \
            .select_related('patient', 'doctor') \
            .order_by(
                # issued (pending) comes before dispensed (done)
                models.Case(
                    models.When(status='issued', then=0),
                    models.When(status='dispensed', then=1),
                    default=2,
                    output_field=models.IntegerField(),
                ),
                '-created_at'  # within each group, newest first
            )

        patient_name = self.request.query_params.get('patient')
        if patient_name:
            queryset = queryset.filter(patient__full_name__icontains=patient_name)

        return queryset


# Pharmacist marks prescription as dispensed
class DispensePrescriptionView(APIView):
    permission_classes = [IsPharmacist]

    def patch(self, request, pk):
        try:
            prescription = Prescription.objects.get(pk=pk)
        except Prescription.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if prescription.status != 'issued':
            return Response(
                {'error': 'Only issued prescriptions can be dispensed'},
                status=400
            )

        # subtract quantities from inventory
        for item in prescription.items.all():
            try:
                inventory = Inventory.objects.get(medicine=item.medicine)
                # don't go below 0
                inventory.quantity = max(0, inventory.quantity - item.quantity_prescribed)
                inventory.save()
            except Inventory.DoesNotExist:
                pass  # medicine has no inventory row, skip it

        prescription.status = 'dispensed'
        prescription.save()
        return Response(PrescriptionSerializer(prescription).data)


# Pharmacist adds a new medicine + creates its inventory row in one shot
class MedicineCreateWithInventoryView(APIView):
    permission_classes = [IsPharmacist]

    def post(self, request):
        medicine_serializer = MedicineSerializer(data=request.data)
        if not medicine_serializer.is_valid():
            return Response(medicine_serializer.errors, status=400)
        
        medicine = medicine_serializer.save()

        # auto-create inventory row with quantity from request or default 0
        Inventory.objects.create(
            medicine=medicine,
            quantity=request.data.get('quantity', 0),
            unit=request.data.get('unit', 'boxes')
        )

        return Response(medicine_serializer.data, status=201)


# Pharmacist updates quantity of existing medicine
class InventoryIncrementView(APIView):
    permission_classes = [IsPharmacist]

    def patch(self, request, pk):
        try:
            inventory = Inventory.objects.get(pk=pk)
        except Inventory.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        amount = request.data.get('amount')
        if amount is None or not isinstance(amount, int) or amount <= 0:
            return Response({'error': 'Provide a positive integer amount'}, status=400)

        inventory.quantity += amount
        inventory.save()
        return Response(InventorySerializer(inventory).data)
    


# =======

# Search patients by name
class PatientSearchView(generics.ListAPIView):
    permission_classes = [IsDoctor]
    serializer_class = PatientSerializer

    def get_queryset(self):
        name = self.request.query_params.get('name', '')
        return Patient.objects.filter(full_name__icontains=name)


# Search medicines by name (for the dropdown)
class MedicineSearchView(generics.ListAPIView):
    serializer_class = MedicineSerializer

    def get_queryset(self):
        name = self.request.query_params.get('name', '')
        return Medicine.objects.filter(name__icontains=name)[:10]  # limit to 10 results


# Doctor's prescription history
class DoctorPrescriptionHistoryView(generics.ListAPIView):
    permission_classes = [IsDoctor]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        return Prescription.objects.filter(
            doctor=self.request.user
        ).exclude(status='draft').prefetch_related('items__medicine').select_related('patient')


class MedicineAvailabilityView(APIView):
    permission_classes = [IsDoctor]

    def get(self, request, pk):
        try:
            inventory = Inventory.objects.get(medicine_id=pk)
            return Response({
                'available': inventory.quantity > 0,
                'quantity': inventory.quantity,
                'unit': inventory.unit,
            })
        except Inventory.DoesNotExist:
            return Response({'available': False, 'quantity': 0, 'unit': ''})
        

# Change password — requires being logged in
class ChangePasswordView(APIView):
    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Both fields are required'}, status=400)

        if not request.user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=400)

        if len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters'}, status=400)

        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Password changed successfully'})


# send OTP to email
class RequestOTPView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If this email exists, an OTP has been sent'})

        otp = str(random.randint(100000, 999999))
        cache.set(f'otp_{email}', otp, timeout=600)

        try:
            send_mail(
                subject='Your Password Reset OTP',
                message=f'Your OTP is: {otp}\n\nThis code expires in 10 minutes.',
                from_email=None,
                recipient_list=[email],
                fail_silently=False, 
            )
        except Exception as e:
            print('EMAIL ERROR:', e)
            return Response({'error': f'Failed to send email: {str(e)}'}, status=500)

        return Response({'message': 'If this email exists, an OTP has been sent'})


# verify OTP and set new password
class ResetPasswordView(APIView):
    permission_classes = []  # no auth required

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not all([email, otp, new_password]):
            return Response({'error': 'All fields are required'}, status=400)

        cached_otp = cache.get(f'otp_{email}')

        if cached_otp is None:
            return Response({'error': 'OTP has expired. Request a new one.'}, status=400)

        if cached_otp != otp:
            return Response({'error': 'Invalid OTP'}, status=400)

        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        user.set_password(new_password)
        user.save()
        cache.delete(f'otp_{email}')  # OTP used, delete it immediately

        return Response({'message': 'Password reset successfully'})
    
# Edit or delete a patient
class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsDoctor]
    serializer_class = PatientSerializer
    queryset = Patient.objects.all()


# Edit or delete a prescription item (only if prescription is still draft)
class PrescriptionItemDetailView(APIView):
    permission_classes = [IsDoctor]

    def patch(self, request, prescription_id, item_id):
        try:
            prescription = Prescription.objects.get(id=prescription_id, doctor=request.user)
            item = PrescriptionItem.objects.get(id=item_id, prescription=prescription)
        except (Prescription.DoesNotExist, PrescriptionItem.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)

        if prescription.status != 'draft':
            return Response({'error': 'Cannot modify an issued prescription'}, status=400)

        serializer = PrescriptionItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, prescription_id, item_id):
        try:
            prescription = Prescription.objects.get(id=prescription_id, doctor=request.user)
            item = PrescriptionItem.objects.get(id=item_id, prescription=prescription)
        except (Prescription.DoesNotExist, PrescriptionItem.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)

        if prescription.status != 'draft':
            return Response({'error': 'Cannot modify an issued prescription'}, status=400)

        item.delete()
        return Response(status=204)