import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarPage from '../pages/Calendar';
import { ToastContainer, toast } from 'react-toastify';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import '@testing-library/jest-dom';

// Mock axios and FullCalendar components
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
}));

describe('CalendarPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
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
})

  // test('handles adding a new event', async () => {
  //   render(
  //     <MemoryRouter>
  //       <CalendarPage />
  //       <ToastContainer />
  //     </MemoryRouter>
  //   );
  //   fireEvent.click(screen.getByText('Add Event')); });
  
  // test('Shows popup add event', async () => {
  //   render(
  //     <MemoryRouter>
  //       <CalendarPage />
  //       <ToastContainer />
  //     </MemoryRouter>
  //   );
  
  //   fireEvent.click(screen.getByText('Add Event'));
  //   await waitFor(() => {
  //     expect(screen.getByText('Event added successfully')).toBeInTheDocument();
  //   });

  // test('Submit event', async () => {
  //   render(
  //     <MemoryRouter>
  //       <CalendarPage />
  //       <ToastContainer />
  //     </MemoryRouter>
  //   );
  
  //   fireEvent.click(screen.getByText('Add Event'));
  
  //   fireEvent.change(screen.getByLabelText('Title:'), { target: { value: 'New Event' } });
  //   fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'New Description' } });
  //   fireEvent.change(screen.getByLabelText('Start:'), { target: { value: '2025-03-16T10:00' } });
  //   fireEvent.change(screen.getByLabelText('End:'), { target: { value: '2025-03-16T12:00' } });
    
  //   fireEvent.click(screen.getByText('Save Event'));

  //   await waitFor(() => {expect(handleSubmit).toHaveBeenCalled();});
  //   await waitFor(() => {expect(screen.getByText('New Event')).toBeInTheDocument()});

  // });

  // });


   