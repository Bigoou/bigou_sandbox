import axios from 'axios';


const SCOPES = [
    "user-read-email", 
    "user-read-private", 
    "playlist-read-private", 
    "user-library-read"
];

export function getSpotifyUrl() {
    const rootUrl = 'https://accounts.spotify.com/authorize';
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    const scopes = SCOPES.join(' ');
    const queryParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: scopes,
        show_dialog: 'true'
      });
      return `${rootUrl}?${queryParams.toString()}`;
}

export async function searchSpotify(query, token) {
    const { data } = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return data;
}

export async function getTrendingSongs(token) {
    try {
        // Using Spotify's "Global Top 50" playlist as an example (you'll need the actual playlist ID)
        const playlistId = '37i9dQZEVXbMDoHDwVN2tF'; // Example ID, replace with actual playlist ID for trending songs
        const { data } = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=5`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return data;
    } catch (error) {
        console.error('Error fetching trending songs:', error);
        throw error;
    }
}

export async function getFavoriteTracks(token) {
    try {
        const { data } = await axios.get('https://api.spotify.com/v1/me/tracks', {
            params: {
                limit: 5  // Limite la requête aux 5 premières pistes
            },
            headers: {
                Authorization: `Bearer ${token}`,  // Utilise le token OAuth pour l'autorisation
            },
        });

        return data.items;  // Retourne les pistes sauvegardées
    } catch (error) {
        console.error('Error fetching favorite tracks:', error);
        throw error;
    }
}

