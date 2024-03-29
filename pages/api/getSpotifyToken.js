import axios from 'axios';

export default async function handler(req, res) {
    const spotifyClientID = process.env.SPOTIFY_CLIENT_ID;
    const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const basic = Buffer.from(`${spotifyClientID}:${spotifyClientSecret}`).toString('base64');
    const { data } = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );
    res.status(200).json({ token: data.access_token });
}