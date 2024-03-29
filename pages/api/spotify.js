import axios from 'axios';

export async function getSpotifyToken() {
    // Send a POST request to the token endpoint URI.
    // Add the Content - Type header set to the application / x - www - form - urlencoded value.
    // Add a HTTP body containing the Client ID and Client Secret, along with the grant_type parameter set to client_credentials.
    // The Client ID and Client Secret are Base64 encoded.

    const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

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

    return data.access_token;
};

export async function searchSpotify(query, token) {
    const { data } = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return data;
}
