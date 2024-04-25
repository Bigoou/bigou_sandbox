import { getSpotifyUrl } from "../spotify";

export default function handler(req, res) {
    res.redirect(307, getSpotifyUrl());
  }