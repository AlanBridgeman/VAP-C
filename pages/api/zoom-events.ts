import { NextApiRequest, NextApiResponse } from "next";

/**
 * Provide an API endpoint for the "All Recordings have completed" Zoom 
 * webhook
 * 
 * The *All Recordings have completed* event is triggered every time a 
 * recording of a meeting or webinar becomes available to view and/or 
 * download.
 * 
 * All users with a Pro or a higher plan have access to [cloud recordings](https://support.zoom.us/hc/en-us/articles/203741855-Cloud-Recording), 
 * An account owner or account admin can [enable cloud recording](https://support.zoom.us/hc/en-us/articles/203741855-Cloud-Recording#h_29fc1846-190d-4f05-ab23-1070c8106ec8) 
 * for all account members and members that belong to a certain group. 
 * Users can also enable cloud recordings [for their own use](https://support.zoom.us/hc/en-us/articles/203741855-Cloud-Recording#h_4cca2458-cbd5-4439-933c-57c0d62a2753).
 * 
 * Only a meeting/webinar host or a co-host can start and complete a 
 * [cloud recording](https://support.zoom.us/hc/en-us/articles/203741855-Cloud-Recording). 
 * A recording is considered complete after the host or co-host ends the 
 * meeting/webinar.
 * 
 * @see https://marketplace.zoom.us/docs/api-reference/webhook-reference/recording-events/recording-completed
 * 
 * @param req 
 * @param res 
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // If the request isn't JSON return a 400 Bad Request with a proper JSON containing error information
    // See https://stackoverflow.com/a/67018299/3092062 for background
    if(req.headers["content-type"] != 'application/json') {
        res.status(400).json({ code: '1', message: 'Response needs to be JSON' });
    }

    console.log('Event: ' + req.body.event);                                                                  // The name of the event (ex. "recording.completed")
    console.log('Event Timestamp: ' + req.body.event_ts);                                                               // A timestamp at which the event occured (ex. "1626230691572")
    console.log('Account (ID): ' + req.body.payload.account_id);                                                     // The account ID of the host or co-host who ended the meeting or webinar and also completed the recording (ex. "AAAAAABBBB")
    console.log('Object ID: ' + req.body.payload.object.id);                                                      // The meeting or webinar's ID (ex. "1234567890")
    console.log('Object UUID: ' + req.body.payload.object.uuid);                                                    // The meeting or webinar's universally unique ID (UUID) (ex. "4444AAAiAAAAAiAiAiiAii==")
    console.log('Host (ID): ' + req.body.payload.object.host_id);                                                 // The ID of the user who is assigned as this meeting or webinar's host (ex. "x1yCzABCDEfg23HiJKl4mN")
    console.log('Account (ID) - Object: ' + req.body.payload.object.account_id);                                              // The account ID of the host or co-host who ended the meeting or webinar and also completed the recroding (ex. "x1yCzABCDEfg23HiJKl4mN")
    console.log('Topic: ' + req.body.payload.object.topic);                                                   // The meeting or webinar topic (ex. "My Personal Recording")
    
    // The recording's associated type of meeting or webinar 
    // 
    // If the recording is of a meeting: 
    // 
    // 1 - Instant meeting
    // 2 - Scheduled meeting
    // 3 - A recurring meeting with no fixed time
    // 4 - A meeting created via PMI (Personal Meeting ID)
    // 7 - A [Personal Audio Conference](https://support.zoom.us/hc/en-us/articles/204517069-Getting-Started-with-Personal-Audio-Conference) (PAC)
    // 8 - Recurring meeting with a fixed time
    // 
    // If the recording is of a webinar: 
    // 
    // 5 - A webinar
    // 6 - A recurring webinar without a fixed time
    // 9 - A recurring webinar with a fixed time
    // 
    // If the recording is not from a meeting or webinar: 
    // 
    // 99 - A recording uploaded via the [Recordings](https://zoom.us/recording) interface on the Zoom Web Portal
    // 
    // (ex. 4)
    console.log('Object Type: ' + req.body.payload.object.type);
    
    console.log('Object Start Time: ' + req.body.payload.object.start_time);                                                      // The meeting or webinar's start time (ex. "2021-07-13T21:44:51Z")
    console.log('Timezone: ' + req.body.payload.object.timezone);                                                        // The meeting or webinar's timezone (ex. "America/Los_Angeles")
    console.log('Host Email: ' + req.body.payload.object.host_email);                                                      // Email address of the host (ex. "user@example.com")
    console.log('Duration: ' + req.body.payload.object.duration);                                                        // The recordings duration (ex. 60)
    console.log('Password: ' + req.body.payload.object.password);                                                        // The meeting or webinar's password (ex. "132456")
    console.log('Share URL: ' + req.body.payload.object.share_url);                                                       // The URL at which approved users can view the recording (ex. "https://example.com")
    console.log('Total Size: ' + req.body.payload.object.total_size);                                                      // The recording file's total size. in bytes (ex. 3328371)
    console.log('Number of Recordings: ' + req.body.payload.object.recording_count);                                                 // The number of completed redording files (ex. 2)
    
    req.body.payload.object.thumbnail_links.forEach((thumbnail_download_url, index) => {           // A list of thumbnail file URLs (ex. [ "https://example.com/replay/2021/07/25/123456789/E54E639G-37B1-4E1G-0D17-3BAA548DD0CF/GMT20210725-123456_Recording_gallery_widthxheight_tb_width1xheight1.jpg" ])
        console.log(`Thumbnail ${index} URL: ` + thumbnail_download_url);                                                              // The URL at which to download the the thumbnail(ex. "https://example.com/replay/2021/07/25/123456789/E54E639G-37B1-4E1G-0D17-3BAA548DD0CF/GMT20210725-123456_Recording_gallery_widthxheight_tb_width1xheight1.jpg")
    });

    req.body.payload.object.recording_files.forEach((recording, index) => {                        // Information about the completed recording files
        console.log(`Recording ${index} ID: ` + recording.id);                                                                        // The recording file's ID (ex. "ed6c2f27-2ae7-42f4-b3d0-835b493e4fa8")
        console.log(`Recording ${index} Meeting ID: ` + recording.meeting_id);                                                                // The meeting's ID (ex. "098765ABCD")
        console.log(`Recording ${index} Start: ` + recording.recording_start);                                                           // The date and time at which recording started (ex. "2021-03-23T22:14:57Z")
        console.log(`Recording ${index} End: ` + recording.recording_end);                                                             // The date and time at which recording ended (ex. "2021-03-23T23:15:41Z")
        console.log(`Recording ${index} File Type: ` + recording.file_type);                                                                 // The recording file's type (ex. "M4A")
        console.log(`Recording ${index} File Size: ` + recording.file_size);                                                                 // The recording file's size. in bytes (ex. 246560)
        console.log(`Recording ${index} File Extension: ` + recording.file_extension);                                                            // The recording file's extension (ex. "M4A")
        console.log(`Recording ${index} File Name: ` + recording.file_name);                                                                 // The recording file's name (ex. "recording")
        console.log(`Recording ${index} Play URL: ` + recording.play_url);                                                                  // The URL at which the recording file can be opened and played (ex. "https://example.com/recording/play/Og75t7x2BtEbAkjdlgbfdngBBBB")
        
        // The URL at which to download the the recording
        // 
        // JWT apps
        // 
        // To access a private or password-protected cloud recording of a user in your account, use a [Zoom JWT app](https://marketplace.zoom.us/docs/guides/getting-started/app-types/create-jwt-app). Use the
        // generated JWT token as the value of the `access_token` query parameter and include this query parameter at the end
        // of the URL.
        // 
        // https://{{base-domain}}/recording/download/{{path-to-file-download}}?access_token={{JWT-token}}
        // 
        // OAuth apps
        // 
        // If a user has authorized and installed your OAuth app that contains recording scopes. use the user's 
        // [OAuth access token](https://marketplace.zoom.us/docs/guides/auth/oauth) to download the file. For example:
        //  
        // https://{{base-domain}}/rec/archive/download/xxx?access_token={{OAuth-access-token}}
        // 
        // Note: This field does *not* return for [Zoom On-Premise accounts](https://support.zoom.us/hc/en-us/articles/360034064852-Zoom-On-Premise-Deployment). Instead, this API will return the `file_path` field
        //
        // (ex. "https://example.com/recording/download/Qg75t7xZBtEbAkjdlgbfdngBBBB")
        console.log(`Recording ${index} Download URL: ` + recording.download_url);

        // The file path to the On-Premise account recording
        // 
        // Note: This API returns this field for [Zoom On-Premise accounts](https://support.zoom.us/hc/en-us/articles/360034064852-Zoom-On-Premise-Deployment). It does *not* return the download-url field
        //console.log(`Recording ${index} File Path: ` + recording.file_path);
        
        // The status of the participant audio file 
        //
        // - `completed` - The recording is complete
        // 
        // (ex. "completed")
        console.log(`Recording ${index} Status: ` + recording.status);
        
        // The archived file's recording type
        // 
        // - shared_screen_with_speaker_view(CC)
        // - shared_screen_with_speaker_view
        // - shared_screen_with_gallery_view
        // - gallery_view
        // - shared_screen
        // - audio_only
        // - audio_transcript
        // - chat_file
        // - active_speaker
        // - host_video
        // - audio_only_each_participant
        // - cc_transcript
        // - closed_caption
        // - poll
        // - timeline
        // - thumbnail
        //
        // For more information. read our [Managing and sharing cloud recordings](https://support.zoom.us/hc/en-us/articles/205347605-Managing-and-sharing-cloud-recordings#h_9898497b-e736-4980-a749-d55608f10773) documenatation
        //
        // (ex. "audio_only")
        console.log(`Recording ${index} Type: ` + recording.recording_type);
    });

    req.body.payload.object.participant_audio_files.forEach((participant_audio_file, index) => {   // Information about the participants audio files
        console.log(`Participant Audio ${index} ID: ` + participant_audio_file.id);                                                           // The participant audio file's ID (ex. "ed6c2f27-2ae7-42f4-b3d0-835b493e4fa8")
        console.log(`Participant Audio ${index} Start: ` + participant_audio_file.recording_start);                                              // The participant audio file's start time (ex. "2021-03-23T22:14:57Z")
        console.log(`Participant Audio ${index} End: ` + participant_audio_file.recording_end);                                                // The participant audio file's end tiem (ex. "2021-03-23T23:15:41Z")
        console.log(`Participant Audio ${index} Type: ` + participant_audio_file.recording_type);                                               // !!!NOT IN SCHEMA!!! The type of the participant audio file (ex. "audio_only")
        console.log(`Participant Audio ${index} File Type: ` + participant_audio_file.file_type);                                                    // The participant audio file's format (ex. "M4A")
        console.log(`Participant Audio ${index} File Name: ` + participant_audio_file.file_name);                                                    // The participant audio file's name (ex. "MyRecording")
        console.log(`Participant Audio ${index} File Size: ` + participant_audio_file.file_size);                                                    // The participant audio file's size. in bytes(ex. 246560)
        console.log(`Participant Audio ${index} File Extension: ` + participant_audio_file.file_extension);                                               // The participant audio file's extension (ex. "MP4")
        console.log(`Participant Audio ${index} Play URL: ` + participant_audio_file.play_url);                                                     // The URL at which this participant audio file can be opened and played (ex. "https://example.com/recording/play/Qg75t7xZBtEbAkjdlgbfdngAAAA")
        
        // The URL at which to download the the recording 
        // 
        // JWT apps
        // 
        // To access a private or password-protected cloud recording of a user in your account, use a [Zoom JWT app](https://marketplace.zoom.us/docs/guides/getting-started/app-types/create-jwt-app). Use the
        // generated JWT token as the value of the `access_token` query parameter and include this query parameter at the end
        // of the URL.
        // 
        // https://{{base-domain}}/recording/download/{{path-to-file-download}}?access_token={{JWT-token}}
        // 
        // OAuth apps
        // 
        // If a user has authorized and installed your OAuth app that contains recording scopes. use the user's 
        // [OAuth access token](https://marketplace.zoom.us/docs/guides/auth/oauth) to download the file. For example:
        //  
        // https://{{base-domain}}/rec/archive/download/xxx?access_token={{OAuth-access-token}}
        // 
        // Note: This field does *not* return for [Zoom On-Premise accounts](https://support.zoom.us/hc/en-us/articles/360034064852-Zoom-On-Premise-Deployment). Instead, this API will return the `file_path` field
        // 
        // (ex. "https://example.com/recording/download/Qg75t7xZBtEbAkjdlgbfdngAAAA")
        console.log(`Participant Audio ${index} Download URL: ` + participant_audio_file.download_url);

        // The file path to the On-Premise account recording
        // 
        // Note: This API returns this field for [Zoom On-Premise accounts](https://support.zoom.us/hc/en-us/articles/360034064852-Zoom-On-Premise-Deployment). It does *not* return the download-url field
        //console.log(`Participant Audio ${index} File Path: ` + participant_audio_file.file_path);
        
        // The participant audio file's processing status
        // 
        // - `completed` - The processing of the file is complete
        // - `processing` - The file is processing
        //
        // (ex. "completed")
        console.log(`Participant Audio ${index} Status: ` + participant_audio_file.status);
    });

    // Use this token along with the `download_url` to download the Cloud Recording via an [OAuth app](https://marketplace.zoom.us/docs/guides/getting-started/app-types/create-oauth-app). This token only lasts for 24 
    // hours after generation and thus. you can only download the file within 24 hours of receiving the "recording completed" event 
    // notification.
    // 
    // You can either include the `download_token` as a query parameter or pass it as a Bearer token in the Authorization header of 
    // your HTTP request
    //
    // ## Using Authorization Header (Recommended)
    //
    // ```bash
    // curl --request GET \
    //      --url {download_url} \
    //      --header 'authorization: Bearer {download_token}
    //      --header 'content-type: application-json'
    // ```
    // 
    // ## Using Query Parameter
    // The URL to download this type of recording will follow this structure: `{download_url}/?access_token={download_token}`
    // 
    // Example: https://zoom.us/recording/download/bdfdgdg?access_token=abvdoerbfg
    //
    // (ex. "abJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJodHRwczovL2V2ZW50Lnpvb20udXMiLCJhY2NvdW50SWQiOiJNdDZzdjR1MFRBeVBrd2dzTDJseGlBIiwiYXVkIjoiaHR0cHM6Ly9vYXV0aC56b29tLnVzIiwibWlkIjoieFp3SEc0c3BRU2VuekdZWG16dnpiUT09IiwiZXhwIjoxNjI2MTM5NTA3LCJ1c2VySWQiOiJEWUhyZHBqclMzdWFPZjdkUGtrZzh3In0.a6KetiC6BlkDhf1dP4KBGUE1bb2brMeraoD45yhFx0eSSSTFdkHQnsKmlJQ-hdo9Zy-4vQw3rOxlyoHv583JyZ")
    console.log(`Download Token: ` + req.body.download_token);

    res.status(200).json({ total:'20' });
}