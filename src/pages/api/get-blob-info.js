export default async function handler(req, res) {
    // Get the BLOB id from the URL
    const blob_id = req.query.id;

    // Stubbed out for now but eventually will get URL based on id
    res.status(200).json({ url: "https://videoscriptstorage.blob.core.windows.net/recordings/test_0.mp4" });
}