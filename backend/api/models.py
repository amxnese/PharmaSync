from django.db import models

# Create your models here.

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('doctor', 'Doctor'), ('pharmacist', 'Pharmacist')]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} ({self.role})"

    
class Patient(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female')]

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)  # add this
    created_at = models.DateTimeField(auto_now_add=True)


class Medicine(models.Model):
    FORM_CHOICES = [
        ('tablet', 'Tablet'),
        ('syrup', 'Syrup'),
        ('injection', 'Injection'),
        ('cream', 'Cream'),
    ]

    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255)
    form = models.CharField(max_length=20, choices=FORM_CHOICES)
    dosage_strength = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} {self.dosage_strength}"


class Inventory(models.Model):
    medicine = models.OneToOneField(Medicine, on_delete=models.CASCADE, related_name='inventory')
    quantity = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.medicine.name} - {self.quantity} {self.unit}"


class Prescription(models.Model):
    STATUS_CHOICES = [('draft', 'Draft'), ('issued', 'Issued'), ('dispensed', 'Dispensed')]

    doctor = models.ForeignKey(User, on_delete=models.PROTECT, related_name='prescriptions')
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='prescriptions')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, null=True)
    issued_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription #{self.id} - {self.patient.full_name}"


class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT)
    dosage_instructions = models.CharField(max_length=255)
    duration_days = models.PositiveIntegerField()
    quantity_prescribed = models.PositiveIntegerField()
    available_at_issue = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.medicine.name} for Prescription #{self.prescription.id}"