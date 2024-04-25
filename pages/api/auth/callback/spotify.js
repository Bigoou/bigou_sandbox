// pages/api/auth/callback/spotify.js
import axios from 'axios';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    const { code } = req.query;
    try {
        const tokenResponse = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = tokenResponse.data.access_token;

        // Récupération des informations de profil de l'utilisateur
        const userProfile = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        // Stockage du token et des informations de l'utilisateur dans les cookies
        res.setHeader('Set-Cookie', [
            serialize('spotify_access_token', accessToken, { path: '/' }),
            serialize('spotify_user_name', userProfile.data.display_name, { path: '/' })
        ]);

        res.redirect('/audio-reactive-visuals');
    } catch (error) {
        console.error('Error during Spotify authentication:', error);
        res.status(500).send('Authentication failed');
    }
}
