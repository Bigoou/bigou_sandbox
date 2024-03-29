import axios from 'axios';

export async function searchSpotify(query, token) {
    const { data } = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return data;
}
