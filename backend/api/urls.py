from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CustomTokenView

path('auth/login/', CustomTokenView.as_view(), name='login'),

urlpatterns = [
    path('', views.home),
    # auth
    path('auth/login/', CustomTokenView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.MeView.as_view(), name='me'),

    # patients
    path('patients/', views.PatientListCreateView.as_view()),

    # medicines
    path('medicines/', views.MedicineListCreateView.as_view()),

    # inventory
    path('inventory/', views.InventoryListView.as_view()),
    path('inventory/<int:pk>/', views.InventoryUpdateView.as_view()),

    # prescriptions
    path('prescriptions/', views.PrescriptionListCreateView.as_view()),
    path('prescriptions/<int:pk>/', views.PrescriptionDetailView.as_view()),
    path('prescriptions/<int:prescription_id>/items/', views.PrescriptionItemCreateView.as_view()),

    path('pharmacy/prescriptions/', views.PharmacistPrescriptionListView.as_view()),
    path('pharmacy/prescriptions/<int:pk>/dispense/', views.DispensePrescriptionView.as_view()),
    path('pharmacy/medicines/add/', views.MedicineCreateWithInventoryView.as_view()),
    path('pharmacy/inventory/<int:pk>/increment/', views.InventoryIncrementView.as_view()),

    path('patients/search/', views.PatientSearchView.as_view()),
    path('medicines/search/', views.MedicineSearchView.as_view()),
    path('doctor/prescriptions/history/', views.DoctorPrescriptionHistoryView.as_view()),
    path('medicines/<int:pk>/availability/', views.MedicineAvailabilityView.as_view()),

    path('auth/change-password/', views.ChangePasswordView.as_view()),
    path('auth/request-otp/', views.RequestOTPView.as_view()),
    path('auth/reset-password/', views.ResetPasswordView.as_view()),
    
    path('patients/<int:pk>/', views.PatientDetailView.as_view()),
    path('prescriptions/<int:prescription_id>/items/<int:item_id>/', views.PrescriptionItemDetailView.as_view()),
]