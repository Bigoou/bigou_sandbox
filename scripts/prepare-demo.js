// Script pour télécharger des fichiers audio de démonstration
// À exécuter avec Node.js: node scripts/prepare-demo.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Créer les répertoires s'ils n'existent pas
const demoCoverPath = path.join(process.cwd(), 'public', 'demo-covers');
const demoTrackPath = path.join(process.cwd(), 'public', 'demo-tracks');
if (!fs.existsSync(demoCoverPath)) fs.mkdirSync(demoCoverPath, { recursive: true });
if (!fs.existsSync(demoTrackPath)) fs.mkdirSync(demoTrackPath, { recursive: true });

// Liste des ressources à télécharger (libre de droits)
const resources = [
    // Pistes audio alternatives avec des liens directs
    {
        type: 'track',
        name: 'electronic.mp3',
        url: 'https://www.chosic.com/wp-content/uploads/2021/04/Pointing-The-Way.mp3',
        title: 'Pointing The Way by Ahjay Stelino'
    },
    {
        type: 'track',
        name: 'rock.mp3',
        url: 'https://www.chosic.com/wp-content/uploads/2021/07/The-Epic-Hero-Power-Rock-Soundtrack_Coma-Media.mp3',
        title: 'The Epic Hero by Coma-Media'
    },
    {
        type: 'track',
        name: 'jazz.mp3',
        url: 'https://www.chosic.com/wp-content/uploads/2020/05/Coffee-Chill-by-Prabumi.mp3',
        title: 'Coffee Chill by Prabumi'
    },
    // Images de couverture alternatives avec des liens directs
    {
        type: 'cover',
        name: 'electronic.jpg',
        url: 'https://images.pexels.com/photos/2078071/pexels-photo-2078071.jpeg?cs=srgb&dl=pexels-alexander-krivitskiy-2078071.jpg&fm=jpg&w=640'
    },
    {
        type: 'cover',
        name: 'rock.jpg',
        url: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=640'
    },
    {
        type: 'cover',
        name: 'jazz.jpg',
        url: 'https://images.pexels.com/photos/4940828/pexels-photo-4940828.jpeg?auto=compress&cs=tinysrgb&w=640'
    }
];

// Fonction pour télécharger un fichier
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        console.log(`Téléchargement de ${destination}...`);

        // Supprimer le fichier s'il existe déjà pour éviter les problèmes
        if (fs.existsSync(destination)) {
            fs.unlinkSync(destination);
            console.log(`Ancien fichier supprimé: ${destination}`);
        }

        const file = fs.createWriteStream(destination);

        // Gestion des redirections et des différents protocoles
        const request = url.startsWith('https://') ?
            require('https').get(url) :
            require('http').get(url);

        request.on('response', (response) => {
            // Vérifier le code de statut HTTP
            if (response.statusCode !== 200) {
                fs.unlinkSync(destination);
                reject(new Error(`Téléchargement échoué, statut ${response.statusCode} pour ${url}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`✅ Téléchargement terminé: ${destination} (${Math.round(fs.statSync(destination).size / 1024)} Ko)`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => { }); // Supprimer le fichier en cas d'erreur, ignorer les erreurs de suppression
            console.error(`❌ Erreur: ${err.message}`);
            reject(err);
        });
    });
}

// Exécuter les téléchargements
async function runDownloads() {
    console.log('🎵 Préparation des fichiers de démo...');

    for (const resource of resources) {
        const destPath = path.join(
            process.cwd(),
            'public',
            resource.type === 'track' ? 'demo-tracks' : 'demo-covers',
            resource.name
        );

        try {
            await downloadFile(resource.url, destPath);
            if (resource.title) {
                console.log(`   Titre: ${resource.title}`);
            }
        } catch (error) {
            console.error(`Erreur lors du téléchargement de ${resource.name}:`, error);
        }
    }

    console.log('🎉 Tous les fichiers ont été téléchargés!');
    console.log('📝 N\'oubliez pas d\'adapter les chemins dans app/audio-reactive-visuals/page.jsx si nécessaire.');
}

runDownloads(); 