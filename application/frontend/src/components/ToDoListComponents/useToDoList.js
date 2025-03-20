import { useState, useEffect } from 'react';
import { getAuthenticatedRequest } from "../../utils/authService";

const useToDoList = (isShared, listId) => {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let data;
                if (!isShared) {
                    data = await getAuthenticatedRequest(`/todolists/`);
                } else {
                    data = await getAuthenticatedRequest(`/todolists/${listId}/`);
                }
                setLists(data);
            } catch (error) {
                if (error.response) {
                    alert(error.response.data.error);
                }
                console.error("Error fetching to-do lists:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isShared, listId]);

    return { lists, loading, setLists };
};

export default useToDoList;
