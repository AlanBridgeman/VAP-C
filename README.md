# Video Automation Platform - Client/Customer/Consumer (VAP-C) Component

***IMPORTANT*** THIS IS NO LONGER IN USE OR BEING DEVELOPED AND IS PROVIDED AS IS WITHOUT WARRENTY

This is the website (front-end) written using Next.js (JavaScript/Node/React) that's used for user's to be able to interact, pay and do various other tasks regarding the services built into the Video Automation Platform (VAP).

## Table of Contents
* [Why is this no longer used or developed](#why-is-this-no-longer-used-or-developed)
* [Why release this publically](#why-release-this-publically)
* [Internationalization](#internationalization)
* [Zoom](#zoom-webhooks--zoom-oauth-20-app)
* [YouTube](#youtube-oauth-20)
* [Both Relational and NoSQL](#why-both-azure-sql-and-azure-table-storage-nosql)
* [Secure Password Storage](#why-azure-key-vault-for-passwords)

## Why is this no longer used or developed
The short version is, between issues like scope creep as well as architectural problems it was decided that a different dirctions would be more advantageous for what the desired outcome was.

## Why release this publically
Because of the shift in architecture this code has become unused and currently takes up space without serving much purpose. Consequently, the idea of releasing it publically is in the hopes that it may be able to help someone in some way if only as a starting point.

## Internationalization
As someone who is actively trying to learn french, admittedly slowly, I really wanted a way to present that to people meaningfully. What I mean is while my french may be pretty terrible there is definitely a clear effort that I'm making to try to make people feel comfortable in terms of making sure that a translation however bad does exist.

As far as the technical details go, I use the built in i18n support that NextJS has out of the box. And then implemented it as a default local via a middleware stored in the default `_middleware.ts` (compared to other places where I use middleware which are API routes so different). I implemented it as a middleware so that it's easy for people to choose which locale they would prefer to use.

Ideally in the future I will use a dropdown/switcher control of some kind to allow users to be able to select the locale they'd like to use and then use the NEXT_LOCALE cookie to save their choice.

I may also look at implementing as a user property on the user.

## Zoom Webhooks + Zoom OAuth 2.0 App
The reason to use Zoom Webhooks is to be able to "hook" into the existing zoom functionality. That is to trigger specific actions on the part of my website/app/system when certain actions happen within a zoom meeting or account (ex. When recordings become available)

Specifically, I currently have it setup for 6 events:
- All Recordings have completed (for triggering the transfer/download)
- Recording Transcript files have completed
- Recording Started (To trigger an appropriate action via obs-websocket)
- Recording Stopped (To trigger an appropriate action via obs-websocket)
- Recording Paused (To trigger an appropriate action via obs-websocket)
- Recording Resumed (To trigger an appropriate action via obs-websocket)

## Youtube OAuth 2.0
This is actually where this all started from in terms of the video project morphing into my own website that video services are one aspect of. That is that because YouTube only allows for OAuth 2.0 authenticated apps to post to YouTube if I wanted to be able to do that it required me to do OAuth 2.0.

However, anyone familiar with OAuth 2.0 will know that one aspect of is is that they need to consent to the permissions etc.. for the service to provide a token that can be used for future authentication etc... This meant I needed a way for the user to interact with the automation service and provide their consent so that I could get a token that could then later be used when uploading videos.

## Why both Azure SQL and Azure Table Storage (NoSQL)
It's important to know the difference between SQL (relational) databases and NoSQL databases. That is, in a relational database you have a set of tables with a fixed number of columns where all columns will be present for each and every row (regardless if their used or not). In contrast a NoSQL databse has no defined schema and therefor each "row"/entry can have different fields this can be incredibly helpful when there are various properites and many of them may be blank. However, properly constraining the data becomes a challange for the implementing developer and there exists no hard relationships within a NoSQL database. For instance, if an account (that is a containing structure for one or more users) is deleted all the associated user should likely be deleted as well. While you can implment this, and some NoSQL DBMSs support this type of functionality out of the box this is the heart of the difference between these two types.

All that as background, the purpose here of using both Azure SQL and Azure Table Storage is to take advantage of both. That is to store users in their most basic form in the SQL database and with that information (I use the Account ID and User ID as indexs) also associate it with a NoSQL record which contains variable "user properties" that is things that may be set on one user but not another. This saves the pains of having overly large and complex SQL databases that are mostly empty while still retaining the ability to take full advantage of the power of relational databases' relations.

## Why Azure Key Vault for Passwords
While, yes, security wise, Azure key vault may provide somee (I suspect minimal) security advantages in terms how the data is stored because I suspect with the appropriate amount of effort you could probably make the SQL strorage just about as secure.

However, what storing passwords in keyvault does do, is provides a mechanism/infastructure for a BYOK (Bring Your Own Key) mechanism/infastructure that would allow, particularly organizations, individuals if they were so inclided, to keep their passwords themselves in a keyvault they own and manage. It's IMPORTANT to note that while this gives them oversight/management of the storage of passwords themselves they can't decrypt an individual's password because the system only stores the encrypted passwords in the applicable Key Vault.

## Continous Deployment (Github Actions)
This Next.js front end using GitHub Actions to be deployed to an Azure App Services. 

While this part works well currently, remote deploymen



## Structure
The app is written as a  Next.js app.