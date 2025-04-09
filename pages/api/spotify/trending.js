import axios from 'axios';

export default async function handler(req, res) {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const playlistId = '37i9dQZEVXbMDoHDwVN2tF';
        const { data } = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20&market=FR,US,GB`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });


        data.items = data.items.map(item => {
            return {
                ...item,
                track: {
                    ...item.track,
                    has_preview: !!item.track.preview_url
                }
            };
        });

        const tracksWithPreview = data.items.filter(item => item.track.has_preview);

        if (tracksWithPreview.length === 0) {
            console.log('Warning: No tracks with preview_url available in trending. Trying with a specific playlist.');

            const backupPlaylistId = '37i9dQZF1DXcBWIGoYBM5M';

            const backupResponse = await axios.get(`https://api.spotify.com/v1/playlists/${backupPlaylistId}/tracks?limit=10&market=FR,US,GB`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            backupResponse.data.items = backupResponse.data.items.map(item => {
                return {
                    ...item,
                    track: {
                        ...item.track,
                        has_preview: !!item.track.preview_url
                    }
                };
            });

            backupResponse.data.items = backupResponse.data.items.slice(0, 5);

            res.status(200).json(backupResponse.data);
        } else {
            data.items = data.items.slice(0, 5);
            res.status(200).json(data);
        }
    } catch (error) {
        console.error('Error fetching trending songs:', error);
        res.status(500).json({ error: 'Failed to fetch trending songs' });
    }
} 