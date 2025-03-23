import React, { Component, useState } from "react";
import MusicPlayer from "./MusicPlayer";

export default class SpotifyButton extends Component {
    constructor(props) {
        super(props);
        this.state = {
            spotifyAuthenticated: false,
            redirecting: false,
            albumUrl: "",
            tracks: [],
            song: {}  
        };
        this.fetchAlbumTracks = this.fetchAlbumTracks.bind(this);
        this.getCurrentSong = this.getCurrentSong.bind(this);
    }

    handleUrlChange = (e) => {
        this.setState({ albumUrl: e.target.value });
    };

    componentDidMount() {
        const { roomCode } = this.props;
        console.log("Room code in SpotifyButton:", roomCode);
        console.log("Component mounted, initiating authentication check.");
        this.authenticateSpotify(roomCode);
        // this.fetchAlbumTracks();
        this.interval = setInterval(this.getCurrentSong, 1000)
    }

    componentWillUnmount(){
        clearInterval(this.interval);
    }

    authenticateSpotify() {

        if (this.state.spotifyAuthenticated) {
            console.log("User is already authenticated.");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
            console.log("Authorization code received, skipping redirect.");
            return;
        }

        fetch("http://localhost:8000/api/is-authenticated", {credentials: "include"})
            .then(response => response.json())
            .then(data => {
                console.log("Authentication status received:", data.status);
                this.setState({ spotifyAuthenticated: data.status });
                if (!data.status && !this.state.redirecting) {
                    console.log("User not authenticated, fetching auth URL.");
                    this.setState({ redirecting: true }); 
                    fetch("http://localhost:8000/api/get-auth-url", {credentials: "include"})
                        .then(response => response.json())
                        .then(data => {
                            console.log("Redirecting to Spotify login:", data.url);
                            // Using window.location.replace to ensure the history is replaced not to fall back to the same unauthenticated state
                            window.open(data.url);
                        });
                }
            })
            .catch(error => {
                console.error("Error during authentication process:", error);
            });
    }

    fetchAlbumTracks = () => {
        const { albumUrl } = this.state;
        console.log("Fetching album tracks for URL:", albumUrl);
        const match = albumUrl.match(/album\/([a-zA-Z0-9]+)/);
        if (match) {
            const albumId = match[1];
            console.log("Extracted album ID:", albumId);
            fetch(`http://localhost:8000/api/get-album-tracks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ album_url: albumUrl })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("Error fetching tracks:", data.error);
                    this.setState({ error: data.error });
                } else {
                    console.log("Tracks fetched successfully:", data);
                    this.setState({ tracks: data.items });
                }
            })
            .catch(error => {
                console.error("Error fetching tracks:", error);
                this.setState({ error: "Failed to fetch tracks" });
            });
        } else {
            console.error("Invalid Spotify URL", albumUrl);
            this.setState({ error: "Invalid Spotify URL" });
        }
    };
    
    getCurrentSong() {
        fetch("http://localhost:8000/api/current-playing", {credentials: "include"}).then((response) => {
            if(!response.ok){
                return {};
            }
            else{
                return response.json();
            }
        }).then((data) => {
            this.setState({song: data})
            console.log(data);
        });
    }

    
    render() {
        return (
            <div style={{ maxWidth: '300px', margin: 'auto', padding: '10px' }}>
                <MusicPlayer {...this.state.song}/>
            </div>
        );
    }
}