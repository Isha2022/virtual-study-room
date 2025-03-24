import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

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
jest.mock('../firebase-config.js') ;
jest.mock('../assets/thestudyspot.jpeg', () => 'thestudyspot.jpeg');
jest.mock('../assets/blueberry.jpeg', () => 'blueberry.jpeg');
jest.mock('../assets/generate.PNG', () => 'generate.PNG');

test('renders welcome heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/The Study Spot/i); // Or any text present in Welcome.js
    expect(headingElement).toBeInTheDocument();
});  
 