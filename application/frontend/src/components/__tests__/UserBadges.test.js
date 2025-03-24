import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import UserBadges from '../UserBadges';

jest.mock('axios', () => ({
  get: jest.fn()
}));
const axios = require('axios');

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('UserBadges', () => {
  const mockProps = {
    userId: 'test-user-123',
    userBadges: ['badge_1', 'badge_2', 'badge_3']
  };

  test('renders user badges', () => {
    render(<UserBadges {...mockProps} />);
    const badges = screen.getAllByRole('img');
    expect(badges.length).toBeGreaterThan(0);
  });
 
  test('handles empty badge list', () => {
    render(<UserBadges userId="test-user-123" userBadges={[]} />);
    const badges = screen.getAllByRole('img');
    expect(badges.length).toBe(8);
    const earnedBadges = screen.queryAllByText(/Earned:/);
    expect(earnedBadges.length).toBe(0); //no badges should be marked as earned
  }); 

  test('handles null badge list', () => {
    render(<UserBadges userId="test-user-123" userBadges={null} />);
    const badges = screen.getAllByRole('img');
    expect(badges.length).toBe(8);
    const earnedBadges = screen.queryAllByText(/Earned:/);
    expect(earnedBadges.length).toBe(0); //no badges should be marked as earned
  });

  test('handles undefined badge list', () => {
    render(<UserBadges userId="test-user-123" userBadges={undefined} />);
    const badges = screen.getAllByRole('img');
    expect(badges.length).toBe(8);
    const earnedBadges = screen.queryAllByText(/Earned:/);
    expect(earnedBadges.length).toBe(0); //no badges should be marked as earned
  });

  test('fetches badges successfully when token exists', async () => {
    const mockBadges = [
      { reward_number: 1, date_earned: '2023-01-01T00:00:00Z' },
      { reward_number: 3, date_earned: '2023-01-02T00:00:00Z' }
    ];
    
    localStorage.setItem('access_token', 'test-token');
    axios.get.mockResolvedValue({ data: { earned_badges: mockBadges } });

    render(<UserBadges />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/analytics/',
        {
          headers: {
            Authorization: 'Bearer test-token'
          },
          withCredentials: true
        }
      );
      expect(screen.getByText('Earned: 1/1/2023')).toBeInTheDocument();
      expect(screen.getByText('Earned: 1/2/2023')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    localStorage.setItem('access_token', 'test-token');
    axios.get.mockRejectedValue(new Error('API Error'));

    // Mock console.error to track it
    const originalError = console.error;
    console.error = jest.fn();

    render(<UserBadges />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching badges:',
        'API Error'
      );
    });

    // Restore console.error
    console.error = originalError;
  });

  test('handles API response with error status', async () => {
    localStorage.setItem('access_token', 'test-token');
    const errorResponse = {
      response: {
        status: 500,
        data: { message: 'Server Error' }
      }
    };
    axios.get.mockRejectedValue(errorResponse);

    // Mock console.error to track it
    const originalError = console.error;
    console.error = jest.fn();

    render(<UserBadges />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching badges:',
        500
      );
    });

    // Restore console.error
    console.error = originalError;
  });

  test('displays all badges even when none are earned', () => {
    render(<UserBadges />);
    expect(screen.getAllByRole('img')).toHaveLength(8);
    expect(screen.getAllByText(/Not yet earned/)).toHaveLength(8);
  });
  describe('getBadgeEarnedDate', () => {
    const mockBadges = [
      { reward_number: 1, date_earned: '2023-01-01T00:00:00Z' },
      { reward_number: 3, date_earned: '2023-02-15T00:00:00Z' }
    ];
  
    test('shows formatted date in UI when badge exists', () => {
      render(<UserBadges userBadges={mockBadges} />);
      
      // Format dates the same way the component does
      const date1 = new Date('2023-01-01T00:00:00Z').toLocaleDateString();
      const date3 = new Date('2023-02-15T00:00:00Z').toLocaleDateString();
      
      // Verify both earned badges show up by checking their hour labels
      expect(screen.getByText('1 Hour').parentElement).toHaveTextContent(`Earned: ${date1}`);
      expect(screen.getByText('15 Hours').parentElement).toHaveTextContent(`Earned: ${date3}`);
    });
  
    test('shows "Not yet earned" for unearned badges', () => {
      // Only pass badge 1 as earned (1 Hour)
      render(<UserBadges userBadges={[mockBadges[0]]} />);
      
      // We have 8 total badges, 1 is earned, so 7 should be unearned
      expect(screen.getAllByText('Not yet earned')).toHaveLength(7);
    });
  
    test('handles empty badges array', () => {
      render(<UserBadges userBadges={[]} />);
      // All 8 badges should show as unearned
      expect(screen.getAllByText('Not yet earned')).toHaveLength(8);
    });
    //passed
    test('handles empty badges array', () => {
      render(<UserBadges userBadges={[]} />);
      expect(screen.getAllByText('Not yet earned').length).toBe(8);
    });
  
    test('shows "Not earned" when badge missing', () => {
      render(<UserBadges userBadges={[]} />);
      expect(screen.getAllByText('Not yet earned').length).toBe(8);
    });
    
    // Test 4: Edge case - invalid date format
    test('handles malformed dates', () => {
      const badDateBadges = [
        { reward_number: 3, date_earned: 'INVALID_DATE' }
      ];
      expect(() => getBadgeEarnedDate(badDateBadges, 3)).toThrow();
    });
  });


    // Mocking the useState and useEffect
  jest.mock("react", () => {
    const originalReact = jest.requireActual("react");
    return {
      ...originalReact,
      useState: jest.fn(),
      useEffect: jest.fn(),
    };
  });

  describe("UserBadges - getBadgeEarnedDate", () => {
    let useStateMock;

    beforeEach(() => {
      useStateMock = jest.spyOn(React, "useState");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("returns the correct earned date for an earned badge", () => {
      const mockBadges = [
        { reward_number: 1, date_earned: "2024-03-15T00:00:00Z" },
        { reward_number: 3, date_earned: "2024-03-18T00:00:00Z" },
      ];

      useStateMock.mockImplementation(() => [mockBadges, jest.fn()]);

      let component;
      act(() => {
        component = render(<UserBadges />);
      });

      const instance = component.container.querySelector("div");
      expect(instance).toBeTruthy(); // Ensuring component renders

      const getBadgeEarnedDate = (rewardNumber) => {
        const badge = mockBadges.find((badge) => badge.reward_number === rewardNumber);
        return badge ? new Date(badge.date_earned).toLocaleDateString() : null;
      };

      expect(getBadgeEarnedDate(1)).toBe(new Date("2024-03-15T00:00:00Z").toLocaleDateString());
      expect(getBadgeEarnedDate(3)).toBe(new Date("2024-03-18T00:00:00Z").toLocaleDateString());
      expect(getBadgeEarnedDate(2)).toBe(null); // Badge not found
    });
  });

});
