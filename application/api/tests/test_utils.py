from django.test import TestCase
from django.utils import timezone
from api.models.events import Appointments
from api.utils import Calendar
from datetime import datetime, timedelta

class CalendarTest(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create test events
        self.now = timezone.now()
        self.year = self.now.year
        self.month = self.now.month
        
        # Events for current month
        self.event1 = Appointments.objects.create(
            name="Team Meeting",  # Changed from 'name' to your actual field name
            start_date=self.now.replace(hour=10, minute=0),  # Changed from 'start_date'
            end_date=self.now.replace(hour=11, minute=0),  # Changed from 'end_date'
            comments="Test meeting"
        )
        
        # Event on same day as event1
        self.event2 = Appointments.objects.create(
            name="Lunch with Client",
            start_date=self.now.replace(hour=12, minute=0),
            end_date=self.now.replace(hour=13, minute=0),
            comments="Test meeting"
        )
        
        # Event on different day
        next_day = self.now + timedelta(days=1)
        self.event3 = Appointments.objects.create(
            name="Project Review",
            start_date=next_day.replace(hour=14, minute=0),
            end_date=next_day.replace(hour=15, minute=0),
            comments="Test meeting"
        )
        
        # Event in different month (shouldn't appear)
        next_month = self.now + timedelta(days=32)
        self.event4 = Appointments.objects.create(
            name="Future Event",
            start_date=next_month,
            end_date=next_month + timedelta(hours=1),
            comments="Test meeting"

        )

    def test_calendar_initialization(self):
        """Test calendar is initialized with correct year and month"""
        cal = Calendar(self.year, self.month)
        self.assertEqual(cal.year, self.year)
        self.assertEqual(cal.month, self.month)

    def test_formatday_no_events(self):
        """Test formatting a day with no events"""
        cal = Calendar(self.year, self.month)
        # Use a day that definitely has no events (like the 1st if our events are later)
        test_day = 1 if self.now.day > 1 else self.now.day + 2
        result = cal.formatday(test_day, Appointments.objects.none())
        
        self.assertIn(f'<span class=\'date\'>{test_day}</span>', result)
        self.assertIn('<ul>', result)
        self.assertNotIn('<li>', result)  # No events should mean no list items

    def test_formatday_with_events(self):
        """Test formatting a day with events"""
        cal = Calendar(self.year, self.month)
        day = self.now.day
        result = cal.formatday(day, Appointments.objects.all())
        
        self.assertIn(f'<span class=\'date\'>{day}</span>', result)
        self.assertIn('Team Meeting', result)
        self.assertIn('Lunch with Client', result)
        self.assertNotIn('Project Review', result)  # Should only show events for this day

    def test_formatday_zero_day(self):
        """Test formatting a zero day (empty calendar cell)"""
        cal = Calendar(self.year, self.month)
        result = cal.formatday(0, Appointments.objects.all())
        self.assertEqual(result, '<td></td>')

    def test_formatweek(self):
        """Test formatting a full week"""
        cal = Calendar(self.year, self.month)
        # Get the weeks for this month
        weeks = cal.monthdays2calendar(self.year, self.month)
        # Test the first week
        week = weeks[0]
        result = cal.formatweek(week, Appointments.objects.all())
        
        self.assertTrue(result.startswith('<tr>'))
        self.assertTrue(result.endswith('</tr>'))
        # Should have 7 days (some may be zero days)
        self.assertEqual(result.count('<td>'), 7)
        
        # Check if current day's events appear
        if self.now.day in [d for d, _ in week]:
            self.assertIn('Team Meeting', result)

    def test_month_header(self):
        """Test the month/year header is correctly formatted"""
        cal = Calendar(self.now.year, self.now.month)
        result = cal.formatmonth()
        
        month_name = self.now.strftime('%B')
        expected_header = f'{month_name} {self.now.year}'
        self.assertIn(expected_header, result)
        self.assertIn('<th colspan="7"', result)  # Header spans all columns

    def test_week_headers(self):
        """Test weekday headers are present"""
        cal = Calendar(self.now.year, self.now.month)
        result = cal.formatmonth()
        
        weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for day in weekdays:
            self.assertIn(f'>{day}<', result)


    def test_empty_days(self):
        """Test days without events are rendered correctly"""
        cal = Calendar(self.now.year, self.now.month)
        result = cal.formatmonth()
        
        # Find a day that definitely has no events (like 1st if events are later)
        test_day = 1 if self.now.day > 1 else self.now.day + 2
        day_html = f'>{test_day}</span><ul>  </ul>'
        self.assertIn(day_html, result)

    def test_empty_month(self):
        """Test a month with no events"""
        # Find a month with no events (previous month)
        no_events_month = self.now.month - 1 if self.now.month > 1 else 12
        no_events_year = self.year if self.now.month > 1 else self.year - 1
        
        cal = Calendar(no_events_year, no_events_month)
        result = cal.formatmonth()
        
        # Should still render full calendar
        self.assertIn('<table', result)
        # Should not have any event content
        self.assertNotIn('<li>', result)