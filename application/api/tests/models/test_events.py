from django.test import TestCase
from api.models.user import User
from datetime import datetime, timedelta
from django.utils import timezone
from api.models.events import Appointments

class EventModelTest(TestCase):
    '''Tests for the Appointments model with current model structure'''

    def setUp(self):
        '''Create test user and sample appointment'''
        self.user = User.objects.create(
            username='testuser',
            email='test@example.com'
            # Add other required user fields as needed by your User model
        )
        
        self.current_time = timezone.now()
        self.appointment = Appointments.objects.create(
            user=self.user,
            name='Doctor Appointment',
            comments='Annual checkup with Dr. Smith',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(hours=1)
        )

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

    def test_optional_fields(self):
        '''Test that optional fields can be null/blank'''
        # Test comments can be blank
        appointment = Appointments.objects.create(
            user=self.user,
            name='Meeting',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(hours=2),
            comments=None
        )
        self.assertIsNone(appointment.comments)
        
        # Test comments can be empty string if allowed by model
        appointment.comments = ''
        appointment.save()
        self.assertEqual(appointment.comments, '')

    def test_string_representation(self):
        '''Test the __str__ method'''
        self.assertEqual(str(self.appointment), 'Doctor Appointment')

    def test_foreign_key_relationship(self):
        '''Test the user foreign key relationship'''
        self.assertEqual(self.appointment.user.pk, self.user.pk)
        self.assertEqual(self.user.appointments_set.first(), self.appointment)

    def test_field_max_lengths(self):
        '''Test character field max lengths'''
        max_length_name = self.appointment._meta.get_field('name').max_length
        max_length_comments = self.appointment._meta.get_field('comments').max_length
        self.assertEqual(max_length_name, 200)
        self.assertEqual(max_length_comments, 500)

    def test_update_appointment(self):
        '''Test updating appointment fields'''
        self.appointment.name = 'Updated Appointment'
        self.appointment.comments = 'Rescheduled appointment'
        new_end_time = timezone.now() + timedelta(hours=2)
        self.appointment.end_date = new_end_time
        self.appointment.save()

        updated_appointment = Appointments.objects.get(pk=self.appointment.pk)
        self.assertEqual(updated_appointment.name, 'Updated Appointment')
        self.assertEqual(updated_appointment.comments, 'Rescheduled appointment')
        # Compare as strings to avoid timezone issues
        self.assertEqual(
            updated_appointment.end_date.strftime("%Y-%m-%d %H:%M:%S"),
            new_end_time.strftime("%Y-%m-%d %H:%M:%S")
        )

    def test_delete_appointment(self):
        '''Test appointment deletion'''
        appointment_id = self.appointment.pk
        self.appointment.delete()
        with self.assertRaises(Appointments.DoesNotExist):
            Appointments.objects.get(pk=appointment_id)

    def test_appointment_with_minimal_fields(self):
        '''Test creation with only required fields'''
        appointment = Appointments.objects.create(
            user=self.user,
            name='Minimal Appointment',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(minutes=30)
        )
        self.assertEqual(appointment.comments, None)
        self.assertEqual(appointment.name, 'Minimal Appointment')

    def test_time_validation(self):
        '''Test that end time is after start time (should not enforce at model level)'''
        # Note: Since your model doesn't have validation, this just tests the data
        self.assertTrue(self.appointment.end_date > self.appointment.start_date)
        
        # This would be invalid but your model allows it
        invalid_appointment = Appointments.objects.create(
            user=self.user,
            name='Invalid Time',
            start_date=self.current_time,
            end_date=self.current_time - timedelta(hours=1)  # End before start
        )
        self.assertTrue(invalid_appointment.end_date < invalid_appointment.start_date)
