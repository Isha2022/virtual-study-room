import React, { useState } from "react";
import "../../styles/toDoList/CreateNewList.css";
import { getAuthenticatedRequest } from "../../utils/authService";

// AddListModal is a modal component for adding a new to-do list
const AddListModal = ({ addListWindow, setAddListWindow, setLists }) => {
  // Local state to store form data for the new list (name and shared status)
  const [formData, setFormData] = useState({ name: "", isShared: false });

  // Handle form submission, saves the list and resets the form
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveList(formData);
    setFormData({ name: "", isShared: false });
  };

  // Handle input changes in the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Function to handle saving the new to-do list via an API request and locally
  const handleSaveList = async (newList) => {
    console.log("Saving list with data:", newList);
    try {
      const response = await getAuthenticatedRequest("/new_list/", "POST", {
        name: newList.name,
        is_shared: newList.isShared,
      });
      
      const newListWithTasks = {
        id: response.listId,
        name: response.name, 
        is_shared: response.isShared, 
        tasks: [],
      };

      setLists((prevLists) => [...prevLists, newListWithTasks]);
      setAddListWindow(false);
      console.log("List Created:", response);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.error);
      } else {
        alert("An error occurred. Please try again.");
      }
    }
  };

  // Handle cancel action by resetting form data and closing the modal
  const handleCancel = () => {
    setFormData({ name: "", isShared: false });
    setAddListWindow(false);
  };

  // Return null if the modal is not open
  if (!addListWindow) return null;
  return (
    <div role="dialog" className="modal-overlay-new-list">
      <div className="modal-content-new-list">
        <h2>Add List</h2>
        <div className="form-class-list">
          <form onSubmit={handleSubmit}>
            <div className="form-group-list">
              <label>List Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter list name"
                required
              />
            </div>
            <div className="button-group-list">
              <button type="submit" className="btn-save-list">
                Save
              </button>
              <button
                type="button"
                className="btn-cancel-list"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddListModal;
