/*import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ToDoList from "../../../components/ToDoListComponents/newToDoList";
import useToDoList from "../../../components/ToDoListComponents/useToDoList";
import { getAuthenticatedRequest } from "../../../utils/authService";

// Mock dependencies
jest.mock("../../../components/ToDoListComponents/useToDoList");
jest.mock("../../../utils/authService", () => ({
    getAuthenticatedRequest: jest.fn(),
}));

jest.mock("../../../utils/authService", () => ({
    getAuthenticatedRequest: jest.fn((url, method) => {
        if (url === "/get_tasks/") {
            return Promise.resolve({
                data: [
                    { id: 101, title: "Task 1", content: "Task 1 details", is_completed: false },
                    { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                ],
            });
        } else if (url === "/delete_task/101/" && method === "DELETE") {
            return Promise.resolve({ success: true });
        }
        return Promise.reject(new Error("Unknown API request"));
    }),
}));


jest.mock("../../../components/ToDoListComponents/useToDoList", () => ({
    __esModule: true,
    default: jest.fn(() => ({
        lists: [
            {
                id: 1,
                name: "Work Tasks",
                tasks: [
                    { id: 101, title: "Task 1", content: "Task 1 details", is_completed: false },
                    { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                ],
            },
        ],
        loading: false,
        setLists: jest.fn(),
    })),
}));

describe("ToDoList Component", () => {
    const mockSetLists = jest.fn();
    const mockSocket = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSetLists.mockClear();

        useToDoList.mockReturnValue({
            lists: [
                {
                    id: 1,
                    name: "Work Tasks",
                    tasks: [
                        { id: 101, title: "Task 1", content: "Task 1 details", is_completed: false },
                        { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                    ],
                },
            ],
            loading: false,
            setLists: mockSetLists,
        });
    });

    test("handles toggling full-screen mode", () => {
        render(<ToDoList isShared={false} />);
        const fullScreenButton = screen.getByText(/view all/i);
        fireEvent.click(fullScreenButton);
        expect(screen.getByText(/exit view/i)).toBeInTheDocument();
    });

    test("renders list and tasks correctly", () => {
        render(<ToDoList isShared={false} />);
        expect(screen.getByText("To-Do Lists")).toBeInTheDocument();
        expect(screen.getByText("Work Tasks")).toBeInTheDocument();
        expect(screen.getByText("Task 1")).toBeInTheDocument();
        expect(screen.getByText("Task 2")).toBeInTheDocument();
    });

    test("renders loading state initially", () => {
        useToDoList.mockReturnValueOnce({
            lists: [],
            loading: true,
            setLists: mockSetLists,
        });

        render(<ToDoList isShared={false} />);
        expect(screen.getByText("Loading To-Do Lists...")).toBeInTheDocument();
    });

    test('toggleTaskCompletion should update task completion', async () => {

        const mockUpdatedListsData = [
            {
                id: 1,
                name: "Work Tasks",
                tasks: [
                    { id: 101, title: "Task 1", content: "Task 1 details", is_completed: true },
                    { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                ],
            },
        ];

        const { rerender } = render(<ToDoList isShared={false} />);


        const taskCheckbox = screen.getByLabelText(/Complete Task 1/i);
        await act(async () => {
            fireEvent.click(taskCheckbox);
        });
        

        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));

        const setListsCallback = mockSetLists.mock.calls[0][0];
        const updatedLists = setListsCallback([
            {
                id: 1,
                name: "Work Tasks",
                tasks: [
                    { id: 101, title: "Task 1", content: "Task 1 details", is_completed: false },
                    { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                ],
            },
        ]);
        expect(updatedLists).toEqual(mockUpdatedListsData);

        useToDoList.mockReturnValue({
            lists: updatedLists,
            loading: false,
            setLists: mockSetLists,
        });
        rerender(<ToDoList isShared={false} />);
        await waitFor(() => {
            expect(taskCheckbox.checked).toBe(true); // Ensure the checkbox is checked
        });

        const taskLabel = screen.getByText(/Task 1/i);
        expect(taskLabel).toHaveClass('completed');
    });


    test("handles deleting a task", async () => {
        const mockSetLists = jest.fn();

        // Mock initial state before deletion
        useToDoList.mockReturnValue({
            lists: [
                {
                    id: 1,
                    name: "Work Tasks",
                    tasks: [
                        { id: 101, title: "Task 1", content: "Task 1 details", is_completed: false },
                        { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                    ],
                },
            ],
            loading: false,
            setLists: mockSetLists,
        });

        getAuthenticatedRequest.mockResolvedValueOnce({ success: true });

        const { rerender } = render(<ToDoList isShared={false} />);

        // Ensure Task 1 exists before deletion
        expect(screen.getByText("Task 1")).toBeInTheDocument();

        // Get delete button for Task 1 and click it
        const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        // Ensure the delete API call was made correctly
        await waitFor(() => {
            expect(getAuthenticatedRequest).toHaveBeenCalledWith("/delete_task/101/", "DELETE");
        });

        // Mock updated state after deletion
        useToDoList.mockReturnValue({
            lists: [
                {
                    id: 1,
                    name: "Work Tasks",
                    tasks: [
                        { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                    ],
                },
            ],
            loading: false,
            setLists: mockSetLists,
        });

        // Re-render with updated state
        rerender(<ToDoList isShared={false} />);

        // Ensure Task 1 is removed, but Task 2 remains
        await waitFor(() => {
            expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
            expect(screen.getByText("Task 2")).toBeInTheDocument();
        });
    });


    test("handles adding a new task", async () => {
        render(<ToDoList isShared={false} />);

        const addTaskButton = screen.getByRole("button", { name: /add list/i });
        fireEvent.click(addTaskButton);

        await waitFor(() => {
            expect(screen.getByText("Add List")).toBeInTheDocument();
        });
    });
});
*/

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ToDoList from "../../../components/ToDoListComponents/newToDoList";
import useToDoList from "../../../components/ToDoListComponents/useToDoList";
import { getAuthenticatedRequest } from "../../../utils/authService";

// Mock dependencies
jest.mock("../../../components/ToDoListComponents/useToDoList");
jest.mock("../../../utils/authService", () => ({
    getAuthenticatedRequest: jest.fn(),
}));


// Shared mock data
const mockSetLists = jest.fn();
const initialMockLists = [
    {
        id: 1,
        name: "Work Tasks",
        tasks: [
            { id: 101, title: "Task 1", content: "Task 1 details", is_completed: false },
            { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
        ],
    },
];

// Helper function to update list state
const getUpdatedLists = (updatedTasks) => [
    {
        id: 1,
        name: "Work Tasks",
        tasks: updatedTasks,
    },
];

beforeEach(() => {
    jest.clearAllMocks();

    useToDoList.mockReturnValue({
        lists: [...initialMockLists],
        loading: false,
        setLists: mockSetLists,
    });

    getAuthenticatedRequest.mockImplementation((url, method) => {
        if (url === "/get_tasks/") {
            return Promise.resolve({ data: [...initialMockLists[0].tasks] });
        }
        if (url === "/delete_task/101/" && method === "DELETE") {
            return Promise.resolve({ success: true });
        }
        return Promise.reject(new Error("Unknown API request"));
    });
});

describe("ToDoList Component", () => {
    test("handles toggling full-screen mode", () => {
        render(<ToDoList isShared={false} />);
        const fullScreenButton = screen.getByText(/view all/i);
        fireEvent.click(fullScreenButton);
        expect(screen.getByText(/exit view/i)).toBeInTheDocument();
    });

    test("renders list and tasks correctly", () => {
        render(<ToDoList isShared={false} />);
        expect(screen.getByText("To-Do Lists")).toBeInTheDocument();
        expect(screen.getByText("Work Tasks")).toBeInTheDocument();
        expect(screen.getByText("Task 1")).toBeInTheDocument();
        expect(screen.getByText("Task 2")).toBeInTheDocument();
    });

    test("renders loading state initially", () => {
        useToDoList.mockReturnValueOnce({ lists: [], loading: true, setLists: mockSetLists });
        render(<ToDoList isShared={false} />);
        expect(screen.getByText("Loading To-Do Lists...")).toBeInTheDocument();
    });

    test('handles toggling task completion', async () => {
        // Mock the API response for toggling task completion
        getAuthenticatedRequest.mockResolvedValueOnce({
            id: 101,
            title: "Task 1",
            content: "Task 1 details",
            is_completed: true, // Simulate the task being marked as completed
        });

        // Render the ToDoList component with the mock setLists function
        const { rerender } = render(<ToDoList isShared={false} setLists={mockSetLists} />);

        // Get the checkbox for Task 1
        const taskCheckbox = screen.getByLabelText(/Complete Task 1/i);

        // Log initial state of the checkbox
        console.log("Initial checkbox state:", taskCheckbox.checked); // Should be false

        // Simulate the checkbox click event
        await act(async () => {
            fireEvent.click(taskCheckbox);
        });

        // Log mockSetLists calls for debugging
        console.log("mockSetLists calls:", mockSetLists.mock.calls);

        // Check if the mockSetLists was called with a function
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));

        // Extract the function passed to mockSetLists
        const setListsCallback = mockSetLists.mock.calls[0][0];

        // Call the function with the initial state to get the updated state
        const updatedLists = setListsCallback([
            {
                id: 1,
                name: "Work Tasks",
                tasks: [
                    { id: 101, title: "Task 1", content: "Task 1 details", is_completed: false },
                    { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                ],
            },
        ]);

        // Log the updated state for debugging
        console.log("Updated Lists:", updatedLists);

        // Verify the updated state matches the expected state
        expect(updatedLists).toEqual([
            {
                id: 1,
                name: "Work Tasks",
                tasks: [
                    { id: 101, title: "Task 1", content: "Task 1 details", is_completed: true },
                    { id: 102, title: "Task 2", content: "Task 2 details", is_completed: true },
                ],
            },
        ]);

        // Update the mock return value to reflect the updated state
        useToDoList.mockReturnValue({
            lists: updatedLists,
            loading: false,
            setLists: mockSetLists,
        });

        // Re-render the component with the updated state
        rerender(<ToDoList isShared={false} setLists={mockSetLists} />);

        // Wait for the checkbox to be checked
        await waitFor(() => {
            expect(taskCheckbox.checked).toBe(true); // Ensure the checkbox is checked
        });

        // Ensure the task label has the 'completed' class
        const taskLabel = screen.getByText(/Task 1/i);
        expect(taskLabel).toHaveClass('completed');
    });



    test("handles deleting a task", async () => {
        const { rerender } = render(<ToDoList isShared={false} />);

        expect(screen.getByText("Task 1")).toBeInTheDocument();

        const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(getAuthenticatedRequest).toHaveBeenCalledWith("/delete_task/101/", "DELETE");
        });

        useToDoList.mockReturnValue({ lists: getUpdatedLists([{ id: 102, title: "Task 2", content: "Task 2 details", is_completed: true }]), loading: false, setLists: mockSetLists });
        rerender(<ToDoList isShared={false} />);

        await waitFor(() => {
            expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
            expect(screen.getByText("Task 2")).toBeInTheDocument();
        });
    });

    test("handles adding a new task", async () => {
        render(<ToDoList isShared={false} />);
        const addTaskButton = screen.getByRole("button", { name: /add list/i });
        fireEvent.click(addTaskButton);
        await waitFor(() => {
            expect(screen.getByText("Add List")).toBeInTheDocument();
        });
    });
});
