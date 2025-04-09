import axios from 'axios';

export default async function handler(req, res) {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const { data } = await axios.get('https://api.spotify.com/v1/me/tracks', {
            params: {
                limit: 20,
                market: 'FR,US,GB'
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Log des résultats pour debug
        console.log('Favorite tracks results:', data.items.map(item => ({
            name: item.track.name,
            has_preview: !!item.track.preview_url,
            preview_url: item.track.preview_url
        })));

        // Ajouter un flag has_preview à chaque piste
        const mappedItems = data.items.map(item => {
            return {
                ...item,
                track: {
                    ...item.track,
                    has_preview: !!item.track.preview_url
                }
            };
        });

        const tracksWithPreview = mappedItems.filter(item => item.track.has_preview);

        if (tracksWithPreview.length === 0) {
            console.log('Warning: No favorite tracks with preview_url available. Using popular tracks instead.');

            const popularArtists = ['The Beatles', 'Michael Jackson', 'Queen', 'Madonna', 'Elvis Presley'];
            const randomArtist = popularArtists[Math.floor(Math.random() * popularArtists.length)];

            const backupResponse = await axios.get(`https://api.spotify.com/v1/search?q=artist:${randomArtist}&type=track&limit=10&market=FR,US,GB`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const backupItems = backupResponse.data.tracks.items.map(track => {
                return {
                    track: {
                        ...track,
                        has_preview: !!track.preview_url
                    }
                };
            });

            const limitedItems = backupItems.slice(0, 5);

            res.status(200).json({ items: limitedItems });
        } else {
            const sortedItems = [...tracksWithPreview, ...mappedItems.filter(item => !item.track.has_preview)];
            const limitedItems = sortedItems.slice(0, 5);

            res.status(200).json({ items: limitedItems });
        }
    } catch (error) {
        console.error('Error fetching favorite tracks:', error);
        res.status(500).json({ error: 'Failed to fetch favorite tracks' });
    }
} 