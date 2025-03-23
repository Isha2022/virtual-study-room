import { renderHook, act } from "@testing-library/react";
import useWebSocket from "../../ToDoListComponents/useWebSocket";


global.WebSocket = jest.fn().mockImplementation(() => {
    const instance = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onclose: jest.fn(() => {
            console.log("WebSocket onclose called");
        }),
        close: jest.fn().mockImplementation(function () {
            console.log("WebSocket close called");
            if (typeof this.onclose === 'function') {
                this.onclose(); // Trigger the onclose handler
            }
        }),
    };
    return instance;
});

describe("useWebSocket Hook", () => {
    let mockSetLists;
    let mockSocket;

    beforeEach(() => {
        
        jest.clearAllMocks(); // Clear all mocks before each test
        jest.spyOn(console, 'log').mockImplementation(() => { }); // Suppress console.log
        mockSetLists = jest.fn();
        mockSocket = {}; // Mock socket object if needed (empty object here)
    });
      test("does not connect WebSocket if isShared is false", () => {
        act(() => {
            renderHook(() => useWebSocket(false, mockSocket, 1, mockSetLists, "room123"));
        });
         expect(global.WebSocket).not.toHaveBeenCalled();
    });
     test("connects WebSocket when isShared is true", () => {
        act(() => {
            renderHook(() => useWebSocket(true, mockSocket, 1, mockSetLists, "room123"));
        });
         expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:8000/ws/todolist/room123/");
    });

    test("logs WebSocket connection when opened", () => {
         const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
         act(() => {
            renderHook(() => useWebSocket(true, {}, 1, jest.fn(), "room123"));
        });
         const wsInstance = global.WebSocket.mock.instances[0];
         act(() => {
            wsInstance.onopen();
        });
         expect(consoleLogSpy).toHaveBeenCalledWith("WebSocket connected");
         consoleLogSpy.mockRestore();
    });

    test("handles WebSocket messages", () => {
        const mockMessage = { data: JSON.stringify({ type: "add_task", task: { id: 1, name: "New Task", is_completed: false } }) };

        act(() => {
            renderHook(() => useWebSocket(true, mockSocket, 1, mockSetLists, "room123"));
        });
         const wsInstance = global.WebSocket.mock.instances[0];
         act(() => {
            wsInstance.onmessage(mockMessage);
        });

        expect(mockSetLists).toHaveBeenCalled();
    });

    test("handles remove_task WebSocket messages", () => {

        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];

        const mockSetLists = jest.fn();

        const mockMessage = {
            data: JSON.stringify({
                type: "remove_task",
                task_id: 2,
            }),
        };

        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });

        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });

        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        
        const expectedLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false }, // Task 2 is removed
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];

        expect(updatedLists).toEqual(expectedLists);
    });

    test("handles toggle_task WebSocket messages", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "toggle_task",
                task_id: 1, // Task ID to toggle
                is_completed: true, // New completion status
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: true }, // Task 1 is toggled
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        expect(updatedLists).toEqual(expectedLists);
    });

    test("handles add_task WebSocket messages", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "add_task",
                task: { id: 4, name: "Task 4", is_completed: false }, // New task to add
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                    { id: 4, name: "Task 4", is_completed: false }, // New task added
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        expect(updatedLists).toEqual(expectedLists);
    });

    test("handles unknown WebSocket message types", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "unknown_type", // Unknown message type
                task_id: 1,
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = initialLists;
        expect(updatedLists).toEqual(expectedLists);
    });

    test("does not add duplicate tasks for add_task WebSocket messages", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "add_task",
                task: { id: 1, name: "Task 1", is_completed: false }, // Duplicate task
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = initialLists;
        expect(updatedLists).toEqual(expectedLists);
    });
});