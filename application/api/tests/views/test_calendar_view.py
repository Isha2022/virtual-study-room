from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models.events import Appointments
from api.serializers import AppointmentSerializer  
from datetime import datetime, timedelta
import json

User = get_user_model()

class EventViewSetTests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            firstname='Test',
            lastname='User',
            description='Test user'
        )
        
        # Set current time for consistent testing
        self.current_time = datetime.now()
        
        # Create initial appointment
        self.appointment = Appointments.objects.create(
            user=self.user,
            name='Doctor Appointment',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(hours=1),
            comments='Annual checkup with Dr. Smith'
        )
        
        # Authenticate the test client
        self.client.force_authenticate(user=self.user)

    def test_appointment_creation(self):
        '''Test basic appointment creation'''
        self.assertEqual(Appointments.objects.count(), 1)
        appointment = Appointments.objects.first()
        self.assertEqual(appointment.name, 'Doctor Appointment')
        self.assertEqual(appointment.comments, 'Annual checkup with Dr. Smith')
        self.assertEqual(appointment.user, self.user)
        # Compare as strings to avoid timezone issues
        self.assertEqual(
            appointment.start_date.strftime("%Y-%m-%d %H:%M:%S"),
            self.current_time.strftime("%Y-%m-%d %H:%M:%S")
        )
        self.assertEqual(
            appointment.end_date.strftime("%Y-%m-%d %H:%M:%S"),
            (self.current_time + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
        )


    def test_create_appointment_unauthenticated(self):
        # Test that unauthenticated users cannot create appointments
        self.client.logout()
        data = {
            "name": "Unauthorized Appointment",
            "start_date": self.current_time.isoformat(),
            "end_date": (self.current_time + timedelta(hours=1)).isoformat()
        }
        response = self.client.post("/api/events/", data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Appointments.objects.count(), 1)

    def test_delete_appointment(self):
        # Test deleting an appointment
        url = f"/api/events/{self.appointment.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Appointments.objects.count(), 0)

    def test_create_appointment_invalid_data(self):
        """Test creation with invalid data"""
        invalid_data = {
            "name": "",  # Empty name should be invalid
            "start_date": self.current_time.isoformat(),
            "end_date": (self.current_time + timedelta(hours=1)).isoformat()
        }
        response = self.client.post("/api/events/", invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    