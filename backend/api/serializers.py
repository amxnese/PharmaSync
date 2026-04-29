from rest_framework import serializers
from django.utils import timezone
from .models import User, Patient, Medicine, Inventory, Prescription, PrescriptionItem


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role', 'phone']


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'


class InventorySerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(), source='medicine', write_only=True
    )

    class Meta:
        model = Inventory
        fields = ['id', 'medicine', 'medicine_id', 'quantity', 'unit', 'last_updated']


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(), source='medicine', write_only=True
    )

    class Meta:
        model = PrescriptionItem
        fields = [
            'id', 'medicine', 'medicine_id',
            'dosage_instructions', 'duration_days',
            'quantity_prescribed', 'available_at_issue'
        ]
        read_only_fields = ['available_at_issue']


class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, read_only=True)
    patient = PatientSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), source='patient', write_only=True
    )
    doctor = UserSerializer(read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'patient', 'patient_id', 'doctor',
            'status', 'notes', 'issued_at', 'created_at', 'items'
        ]
        read_only_fields = ['doctor', 'issued_at']

    def update(self, instance, validated_data):
        # auto set issued_at when status changes to issued
        if validated_data.get('status') == 'issued' and instance.status != 'issued':
            validated_data['issued_at'] = timezone.now()
        return super().update(instance, validated_data)
    
