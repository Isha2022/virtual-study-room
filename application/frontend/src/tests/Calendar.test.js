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

// const mockHandleSubmit = jest.fn();

// // Replace the original handleSubmit with the mock
// jest.mock('../pages/Calendar', () => ({
//   ...jest.requireActual('../pages/Calendar'),
//   handleSubmit: mockHandleSubmit,
// }));

describe('CalendarPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });



  // test('renders CalendarPage correctly', () => {
  //   render(
  //     <MemoryRouter>
  //       <CalendarPage />
  //       <ToastContainer />
  //     </MemoryRouter>
  //   );

  //   // Check if the header is rendered
  //   expect(screen.getByText('My Calendar')).toBeInTheDocument();

  //   // Check if the "Add Event" button is rendered
    
  // });

  // test('Shows popup add event', () => {
  //   render(
  //     <MemoryRouter>
  //       <CalendarPage />
  //       <ToastContainer />
  //     </MemoryRouter>
  //   );
  
  //   // Open the Add Event popup
  //   fireEvent.click(screen.getByText('Add Event'));
  
  //   // Debug the rendered DOM
  //   screen.debug();
  
  //   // Check if the popup is open by verifying the presence of the "Add Event" heading
  //   expect(screen.getByText('Save Event')).toBeInTheDocument();
  
  //   // Check if the "Title:" label is present
  //   expect(screen.getByText('Title:')).toBeInTheDocument();
  
  // });


  it('handles event click and displays event details', async () => {
    render(
          <MemoryRouter>
            <CalendarPage />
            <ToastContainer />
          </MemoryRouter>
        );

    // Simulate adding an event
    const addEventButton = screen.getByText('Add Event');
    fireEvent.click(addEventButton);

    // Fill in the event form and submit it
    const titleInput = screen.getByLabelText('Title:');
    const startInput = screen.getByLabelText('Start:');
    const saveButton = screen.getByText('Save Event');

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(startInput, { target: { value: '2023-10-01T10:00' } });
    fireEvent.click(saveButton);

    // Wait for the event to appear in the DOM
    const eventElement = await screen.findByText('Test Event'); // Corrected function name
    fireEvent.click(eventElement);

    // Check if the event details popup is displayed
    expect(screen.getByText('Event Details')).toBeInTheDocument();
    expect(screen.getByText('Test Event')).toBeInTheDocument();
});

})   