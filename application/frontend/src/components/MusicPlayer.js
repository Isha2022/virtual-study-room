import React, {Component} from 'react';
import {Grid2, Typography, Card, IconButton, LinearProgress} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default class MusicPlayer extends Component{
    constructor(props){
        super(props)
    }

    async playSong() {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        };

        try {
            const response = await fetch("http://localhost:8000/api/play", requestOptions);
            if (!response.ok) {
                let data = await response.json().catch(() => ({ detail: "An unknown error occurred." })); // Fallback error message

                if (response.status === 403) {
                    toast.error("Access denied: You need a Spotify Premium account to use this feature.");
                } else {
                    toast.error(data.detail || "An error occurred. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Network error. Please check your connection.");
        }
    }

    async pauseSong() {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        };

        try {
            const response = await fetch("http://localhost:8000/api/pause", requestOptions);
            if (!response.ok) {
                let data = await response.json().catch(() => ({ detail: "An unknown error occurred." })); // Fallback error message

                if (response.status === 403) {
                    toast.error("Access denied: You need a Spotify Premium account to use this feature.");
                } else {
                    toast.error(data.detail || "An error occurred. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Network error. Please check your connection.");
        }
    }

    async skipSong() {
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        };

        try {
            const response = await fetch("http://localhost:8000/api/skip", requestOptions);
            if (!response.ok) {
                let data = await response.json().catch(() => ({ detail: "An unknown error occurred." })); // Fallback error message

                if (response.status === 403) {
                    toast.error("Access denied: You need a Spotify Premium account to use this feature.");
                } else {
                    toast.error(data.detail || "An error occurred. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Network error. Please check your connection.");
        }
    }


    render(){
        const songProgress = (this.props.time / this.props.duration) * 100;
        return (
            <div>
            <Card>
                <Grid2 container alignItems= "center">
                    <Grid2 item align="center" xs={4}>
                        <img src={this.props.image_url} height="100%" width="100%" ></img>
                    </Grid2>
                    <Grid2 item align="center" xs={8}>
                        <Typography component="h5" variant = "h5">
                            {this.props.title}
                        </Typography>
                        <Typography cover="textSecondary" variant = "subtitle1">
                            {this.props.artist}
                        </Typography>
                        <div>
                            <IconButton 
                            onClick={() => {
                                this.props.is_playing ? this.pauseSong() : this.playSong();
                              }}>
                                {this.props.is_playing ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                            <IconButton onClick={ () => this.skipSong()}>
                                <SkipNextIcon/>
                            </IconButton>
                        </div>
                    </Grid2>
                </Grid2>
                <LinearProgress variant="determinate" value={songProgress} />
            </Card>
            <ToastContainer />
            </div>
        );
    }
}


