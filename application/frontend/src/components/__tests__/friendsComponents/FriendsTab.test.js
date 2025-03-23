import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FriendsTab from "../../friends/FriendsTab";
import * as authService from "../../../utils/authService"; // Ensure correct import
jest.mock("../../friends/AllFriends", () => () => <div data-testid="all-friends">All Friends Content</div>);
jest.mock("../../friends/PendingRequests", () => () => <div data-testid="pending-requests">Pending Requests Content</div>);
jest.mock("../../friends/FriendsRequested", () => () => <div data-testid="friends-requested">Sent Requests Content</div>);
jest.mock("../../friends/SearchFriends", () => () => <div data-testid="search-friends">Search Friends Content</div>);


jest.mock('../../../utils/authService', () => ({
    getAuthenticatedRequest: jest.fn(),
}));

jest.mock('firebase/storage');
jest.mock('../../../firebase-config.js');
jest.mock('react-toastify', () => {
    const actual = jest.requireActual('react-toastify');
    return {
        ...actual,
        toast: {
            error: jest.fn(),
            success: jest.fn(),
        },
    }; 
});

jest.mock("firebase/database", () => ({
    getDatabase: jest.fn(() => ({
        ref: jest.fn(),
        set: jest.fn(),
        get: jest.fn(),
        onValue: jest.fn(),
    })),
}));


delete window.location;
window.location = { assign: jest.fn() };

jest.mock("../../friends/FriendsContext", () => ({
    FriendsProvider: ({ children }) => <div>{children}</div>,
}));

describe("FriendsTab Component", () => {
    test("renders correctly with All Friends tab active by default", () => {
        render(<FriendsTab />);

        const allFriendsButton = screen.getByText("All Friends");
        expect(allFriendsButton).toHaveClass("active");

        expect(screen.getByText("All Friends Content")).toBeInTheDocument();
    });

    test("clicking on the All Friends tab ensures it stays active", () => {
        render(<FriendsTab />);

        const allFriendsButton = screen.getByText("All Friends");
        expect(allFriendsButton).toHaveClass("active");

        fireEvent.click(allFriendsButton);

        expect(allFriendsButton).toHaveClass("active");
    });

    test("switches to Pending Requests tab and toggles active class correctly", () => {
        render(<FriendsTab />);

        const allFriendsButton = screen.getByText("All Friends");
        expect(allFriendsButton).toHaveClass("active");

        fireEvent.click(screen.getByText("Pending Requests"));

        const pendingRequestsButton = screen.getByText("Pending Requests");
        expect(pendingRequestsButton).toHaveClass("active");

        expect(allFriendsButton).not.toHaveClass("active");
    });

    test("ensures the active class toggles correctly when switching tabs", () => {
        render(<FriendsTab />);

        const allFriendsButton = screen.getByText("All Friends");
        expect(allFriendsButton).toHaveClass("active");

        fireEvent.click(screen.getByText("Sent Requests"));
        const sentRequestsButton = screen.getByText("Sent Requests");
        expect(sentRequestsButton).toHaveClass("active");

        expect(allFriendsButton).not.toHaveClass("active");
 
        fireEvent.click(screen.getByText("Search Friends"));
        const searchFriendsButton = screen.getByText("Search Friends");
        expect(searchFriendsButton).toHaveClass("active");

        expect(sentRequestsButton).not.toHaveClass("active");
    });
});
