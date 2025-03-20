import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarPage from '../pages/Calendar';
import { ToastContainer } from 'react-toastify';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import '@testing-library/jest-dom';

console.log(require.resolve('@fullcalendar/react'));

jest.mock('axios');
jest.mock('@fullcalendar/react', () => (props) => (
  <div>
    <button onClick={props.customButtons?.addEventButton?.click}>Add Event</button>
    {props.events?.map((event) => (
      <div key={event.id}>{event.title}</div>
    ))}
  </div>
));

jest.mock('@fullcalendar/daygrid', () => () => <div>Mocked DayGridPlugin</div>);
jest.mock('@fullcalendar/timegrid', () => () => <div>Mocked TimeGridPlugin</div>);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  //useLocation: jest.fn().mockReturnValue({ state: { userId: '123' } }),
}));

describe('CalendarPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders CalendarPage correctly', () => {
    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );

    // Check if the header is rendered
    expect(screen.getByText('My Calendar')).toBeInTheDocument();

    // Check if the "Add Event" button is rendered
    expect(screen.getByText('Add Event')).toBeInTheDocument();
  });

  test('handles adding a new event', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({ data: [] }); // Mock fetchEvents after adding

    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );

    // Open the Add Event popup
    fireEvent.click(screen.getByText('Add Event'));

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Title:'), { target: { value: 'New Event' } });
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'New Description' } });
    fireEvent.change(screen.getByLabelText('Start:'), { target: { value: '2025-03-16T10:00' } });
    fireEvent.change(screen.getByLabelText('End:'), { target: { value: '2025-03-16T12:00' } });

    // Submit the form
    fireEvent.click(screen.getByText('Save Event'));

    // Wait for the success toast
    await waitFor(() => {
      expect(screen.getByText('Event added successfully')).toBeInTheDocument();
    });

    // Ensure the popup is closed
    expect(screen.queryByText('Add Event')).not.toBeInTheDocument();
  });

  test('handles event click and displays event details', async () => {
    const mockEvents = [
      {
        id: 1,
        title: 'Event 1',
        description: 'Description 1',
        start: '2025-03-16T10:00:00',
        end: '2025-03-16T12:00:00',
      },
    ];
    axios.get.mockResolvedValueOnce({ data: mockEvents });

    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );

    // Wait for events to be fetched
    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });

    // Simulate clicking on an event
    fireEvent.click(screen.getByText('Event 1'));

    // Check if event details popup is displayed
    expect(screen.getByText('Event Details')).toBeInTheDocument();
    expect(screen.getByText('Title:')).toBeInTheDocument();
    expect(screen.getByText('Event 1')).toBeInTheDocument();
  });
});