from api.models.user import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory
from api.models.events import Appointments
from datetime import datetime, timedelta
import json


class EventViewSetTests(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            firstname='Test',
            lastname='User',
            description='Test user'
        )
        self.current_time = datetime.now()
        self.appointment = Appointments.objects.create(
            user=self.user,
            name='Doctor Appointment',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(hours=1),
            comments='Annual checkup with Dr. Smith'
        )
        self.client.force_authenticate(user=self.user)

    def test_perform_create_integration(self):
        """Test appointment creation through API with serializer field mappings"""
        data = {
            'title': 'New Appointment',
            'start': self.current_time.isoformat(),
            'end': (self.current_time + timedelta(hours=1)).isoformat(),
            'description': 'Test description'
        }
        response = self.client.post('/api/events/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        appointment = Appointments.objects.latest('id')
        self.assertEqual(appointment.user, self.user)
        self.assertEqual(appointment.name, 'New Appointment')
        self.assertEqual(appointment.comments, 'Test description')

    
    def test_read_only_user_field(self):
        """Verify user cannot be set via API"""
        another_user = User.objects.create_user(
            firstname='another',
            lastname='useranother',
            username='anotheruser_unique',
            email='another@example.com',
            password='testpass123',
            description='not known'
        )
        
        data = {
            'title': 'User Test',
            'start': self.current_time.isoformat(),
            'end': (self.current_time + timedelta(hours=1)).isoformat(),
            'user': another_user.id
        }
        
        response = self.client.post('/api/events/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        appointment = Appointments.objects.latest('id')
        self.assertEqual(appointment.user, self.user)
        self.assertNotEqual(appointment.user, another_user)


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
    
    # def test_perform_create_directly(self):
    #     """Directly test perform_create with serializer field mappings"""
    #     from api.views.calendar import EventViewSet
    #     from rest_framework.request import Request
        
    #     request = self.factory.post('/api/events/', {
    #         'title': 'Direct Test',
    #         'start': self.current_time.isoformat(),
    #         'end': (self.current_time + timedelta(hours=1)).isoformat()
    #     }, format='json')
    #     request.user = self.user
        
    #     drf_request = Request(request)
    #     view = EventViewSet()
    #     view.request = drf_request
    #     view.action = 'create'
        
    #     serializer = view.get_serializer(data=drf_request.data)
    #     self.assertTrue(serializer.is_valid(), serializer.errors)
        
    #     view.perform_create(serializer)
        
    #     appointment = Appointments.objects.latest('id')
    #     self.assertEqual(appointment.user, self.user)
    #     self.assertEqual(appointment.name, 'Direct Test')
