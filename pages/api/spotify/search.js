import axios from 'axios';

export default async function handler(req, res) {
    const { query, token } = req.query;

    if (!query || !token) {
        return res.status(400).json({ error: 'Query and token are required' });
    }

    try {
        const { data } = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=50&market=US,GB,FR,DE,JP,AU,CA,BR,MX,ES`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        data.tracks.items = data.tracks.items.map(track => ({
            ...track,
            has_preview: !!track.preview_url
        }));

        const hasPreviewTracks = data.tracks.items.filter(track => track.has_preview);
        console.log(`Found ${hasPreviewTracks.length} tracks with preview URLs out of ${data.tracks.items.length} total`);

        if (hasPreviewTracks.length === 0) {
            console.log('Warning: No tracks with preview_url available. Trying alternatives.');

            const popularArtists = ['The Beatles', 'Michael Jackson', 'Queen', 'Madonna', 'Elvis Presley',
                'Beyoncé', 'Taylor Swift', 'Ed Sheeran', 'Drake', 'Adele',
                'Ariana Grande', 'Bruno Mars', 'Katy Perry', 'Justin Bieber'];

            const randomArtists = [];
            for (let i = 0; i < 3; i++) {
                const randomIndex = Math.floor(Math.random() * popularArtists.length);
                randomArtists.push(popularArtists[randomIndex]);
            }

            let foundPreviewTracks = [];

            for (const artist of randomArtists) {
                if (foundPreviewTracks.length >= 5) break;

                console.log(`Trying backup search with artist: ${artist}`);
                const backupResponse = await axios.get(`https://api.spotify.com/v1/search?q=${artist}&type=track&limit=20&market=US,GB,FR`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const artistTracks = backupResponse.data.tracks.items
                    .map(track => ({
                        ...track,
                        has_preview: !!track.preview_url
                    }))
                    .filter(track => track.has_preview);

                foundPreviewTracks = [...foundPreviewTracks, ...artistTracks];
            }

            if (foundPreviewTracks.length > 0) {
                console.log(`Found ${foundPreviewTracks.length} alternative tracks with previews`);
                foundPreviewTracks = foundPreviewTracks.slice(0, 5);

                const response = {
                    tracks: {
                        items: foundPreviewTracks,
                        total: foundPreviewTracks.length,
                        limit: 5,
                        offset: 0,
                        previous: null,
                        next: null,
                        href: null
                    }
                };

                res.status(200).json(response);
                return;
            }

            data.tracks.items = data.tracks.items.slice(0, 5);
            res.status(200).json(data);
        } else {
            const sortedItems = [...hasPreviewTracks, ...data.tracks.items.filter(track => !track.has_preview)];
            data.tracks.items = sortedItems.slice(0, 5);
            res.status(200).json(data);
        }
    } catch (error) {
        console.error('Error searching Spotify:', error);
        res.status(500).json({ error: 'Failed to search Spotify' });
    }
} 