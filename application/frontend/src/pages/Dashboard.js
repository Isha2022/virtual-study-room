import React, {useContext} from 'react';
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import ToDoList from '../components/ToDoListComponents/newToDoList';
import StudyRoomComponent from '../components/StudyRoomComponent';
import Analytics from './Analytics';
import FriendsTab  from '../components/friends/FriendsTab';
import { FriendsContext } from '../components/friends/FriendsContext';
import ProfileBox from './ProfileBox';

function Dashboard() { 
    const navigate = useNavigate();
    const { loading } = useContext(FriendsContext);


    return (
        <div className='dashboard-container'>
            <h1 className="dashboard-heading">Dashboard</h1> {/* A simple heading */}

            {/* This is where all the main components will go*/}
            {/* Left panel - main panel - right panel*/}
            <div className = "dashboard-content" data-testid="dashboard-content-test">
                <div className = "dashboard-left-panel" data-testid="left-panel">
                    <div className="dashboard-panel"><ProfileBox /></div>
                    <Analytics />
                </div>
                <div className = "dashboard-main-panel" data-testid="main-panel">
                    <StudyRoomComponent />
                    {!loading ? <FriendsTab /> : <p>Loading friends...</p>} {/*Check if loading is true before rendering friends tab*/}
                </div>
                <div className = "dashboard-right-panel" data-testid="right-panel">
                    <div className = "to-do-list" ><ToDoList
                        isShared={false}
                        listData={[]}
                    />
                    </div>

                </div>

                </div>
            </div>
         );
}

export default Dashboard;
