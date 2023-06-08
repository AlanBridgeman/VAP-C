import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import azure_storage from 'azure-storage';
import axios, { AxiosRequestConfig } from "axios";
import Router from "next/router";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";

import UserRequiredLayout from "../../components/layout/UserRequiredLayout";

import style from '../../styles/video_editing_dashboard.module.css';
import { BlobItem } from "@azure/storage-blob";
import { useVideoList } from "../../lib/hooks";

async function startUpload(e: FormEvent<HTMLFormElement>, fileRef: React.MutableRefObject<HTMLInputElement>, output_elem_mutator: React.Dispatch<React.SetStateAction<JSX.Element>>) {
    e.preventDefault();

    const files = fileRef?.current?.files;
    const name = fileRef?.current?.name;
    const fileArr = Array.from(files);

    //alert(JSON.stringify(files.item(1)));

    var data = new FormData();
    fileArr.forEach((file: File, index: number) => { data.append(name + '[]', file); });
    data.getAll(name + '[]').forEach((file: File, index: number) => { alert(file.name); });
    
    data.append('test', 'test');

    // NOTE: Initially an attempt to use Fetch with 
    //       ReadableStream (https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) 
    //       and the Streams API (https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) 
    //       to show progress as the upload happens was made. 
    //       However, between having implemenation issues 
    //       and support not being consistant yet a 
    //       decision to switch to axios (based on 
    //       XMLHttpRequest) for this task (for now) was made. 
    //       If in the future the Stream API supports 
    //       request body streaming (uploads) better across 
    //       various browsers this may be a improvement at 
    //       that time to look into (as Fetch is more "baked 
    //       into" Next.js instead of Axios which is 
    //       third-party - which there is nothing wrong 
    //       with but one more dependency to manage)
    //       
    //       Resource to help with implementation 
    //       potentially: https://web.dev/fetch-upload-streaming/
    //       
    //       See browser testing: http://w3c-test.org/fetch/api/basic/request-upload.any.html

    const configs: AxiosRequestConfig = {
        headers: {
            'Content-Type':'multipart/form-data'
        },
        onUploadProgress: (e: ProgressEvent) => {
            output_elem_mutator(
                (
                    <Alert variant='warning'>
                        Current progress: { Math.round((e.loaded * 100) / e.total) }
                    </Alert>
                )
            );
        }
    };

    const response: Promise<any> = axios.post('/api/test', data, configs)
    .then(
        (response: any) => {
            output_elem_mutator(
                (
                    <Alert variant='success'>
                        Upload Complete!
                    </Alert>
                )
            ); 
        }
    )
    .catch(
        (response: any) => {
            output_elem_mutator(
                (
                    <Alert variant='error'>
                        {response}
                    </Alert>
                )
            ); 
        }
    )
}

function updateLabel(e: React.ChangeEvent<HTMLInputElement>, labelRef: React.MutableRefObject<HTMLLabelElement>) { 
    let newLabel = labelRef.current.innerHTML.substring(0, labelRef.current.innerHTML.lastIndexOf('>') + 1);
    
    if(e.target.files.length != 0) {
        for(let i=0;i < e.target.files.length;i++) {
            if(i < e.target.files.length) {
                if(i > 0 && i < e.target.files.length) {
                    newLabel += ',';
                }
                newLabel += ' ';
            }
        
            newLabel += e.target.files.item(i).name;
        }
    }
    else {
        newLabel += ' Custom Upload';
    }

    labelRef.current.innerHTML = newLabel;
    
    return newLabel;
}

function startYouTubeUpload(name: string, output_elem_mutator: React.Dispatch<React.SetStateAction<JSX.Element>>, videoList: BlobItem[], table_body_mutator: React.Dispatch<React.SetStateAction<JSX.Element>>) {
    fetch(
        '/api/services/video_editing/youtube-upload',
        {
            method: 'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({name: name}),
        }
    )
    .then(r => r.json())
    .then(json => {
        if(json.hasOwnProperty('redirect')) {
            window.location.assign(json.redirect);
        }
        else {
            console.log('YouTube Output: ' + json);
            
            output_elem_mutator(
                (
                    <Alert variant='success'>
                        Successfully uploaded to <a href={`https://www.youtube.com/watch?v=${json.id}`}>YouTube</a>
                    </Alert>
                )
            );

            updateTableBody(videoList, table_body_mutator, output_elem_mutator);
        }
    })
}

function updateTableBody(videoList: BlobItem[], tableBodyMutator: React.Dispatch<React.SetStateAction<JSX.Element>>, notifierMutator: React.Dispatch<React.SetStateAction<JSX.Element>>) {
    const rows = videoList.map(
        (blob: BlobItem, index: number) => {
            var iframeElem;
            if(Object.keys(blob).includes('metadata') && Object.keys(blob.metadata).includes('youtube_id')) {
                iframeElem = (<iframe width="560" height="315" src={`https://www.youtube.com/embed/${blob.metadata.youtube_id}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>);
            }

            return (
                <tr>
                    <td>{blob.name}</td>
                    <td>
                        {iframeElem}
                    </td>
                    <td>
                        <Button
                            variant="primary"
                            onClick={
                                e => startYouTubeUpload(blob.name, notifierMutator, videoList, tableBodyMutator)
                            }
                        >Upload</Button>
                    </td>
                </tr>
            );
        }
    );

    tableBodyMutator(<>{rows}</>);
}

export function VideoEditingDashboard(props): JSX.Element {
    const labelRef: React.MutableRefObject<HTMLLabelElement> = React.useRef<HTMLLabelElement>(null);
    const fileRef: React.MutableRefObject<HTMLInputElement> = React.useRef<HTMLInputElement>(null);
    const [value, mutator] = useState<JSX.Element>(<></>);
    const [videoList, loading]: [BlobItem[], {loading: boolean}] = useVideoList();
    const [tableBody, setTableBody] = useState<JSX.Element>();
    
    useEffect(() => {
        updateTableBody(videoList, setTableBody, mutator);
    }, [videoList]);
    
    return (
        <>
            <h1>Video Editing Dashboard</h1>
            {value}
            <Form onSubmit={ e => startUpload(e, fileRef, mutator) }>
                <Form.Group className={style.customfileupload}>
                    <Form.Label ref={labelRef} htmlFor="file-upload">
                        <FontAwesomeIcon icon={['fad', 'cloud-upload']} /> Custom Upload
                    </Form.Label>
                    <Form.Control id="file-upload" type="file" ref={fileRef} multiple onChange={(e: ChangeEvent<HTMLInputElement>) => updateLabel(e, labelRef) } />
                </Form.Group>
                <Form.Control type="submit" value="Start" />
            </Form>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Preview</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tableBody}
                </tbody>
            </table>
        </>
    )
}

export default function VideoEditingDasboardWrapper(props) {
    return (
        <UserRequiredLayout onNoUser={() => { Router.replace('/users/Login'); }} onLoading={() => { return <p>Loading...</p> }}>
            <VideoEditingDashboard token={props.token} refresh={props.refresh} approver_email={props.approver_email} />
        </UserRequiredLayout>
    );
}