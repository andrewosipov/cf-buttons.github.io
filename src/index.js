import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Button, Paragraph, HelpText, Spinner, Icon, Tooltip } from '@contentful/forma-36-react-components';
import { init } from 'contentful-ui-extensions-sdk';
import axios from 'axios';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import './index.css';

const url = 'https://api.bitbucket.org/2.0/repositories/musicfirstdevteam/musicfirst-co-uk/pipelines/';
const target = {
    ref_type: "branch",
    type: "pipeline_ref_target"
};
const config = {
    headers: {
        Accept: 'application/json',
        Authorization: 'Basic bWFpbEBhbmRyZXctb3NpcG92LnBybzpsaW1hc3MwbA=='
    }
};

let previewStatusTimer = 0;
let liveStatusTimer = 0;

const Pipelines = (props) => {
    const [isPreviewSpin, setPreviewSpin] = useState(false);
    const [isLiveSpin, setLiveSpin] = useState(false);
    const [completePreviewStatus, setCompletePreviewStatus] = useState(null);
    const [completeLiveStatus, setCompleteLiveStatus] = useState(null);

    const checkPipelineStatus = (uuid, callback) => axios
        .get(`${url}${encodeURI(uuid)}`, config)
        .then((response) => {
            if (response.data.state.name === 'COMPLETED') {
                callback(response.data)
            }
        })

    const stopPreviewTimer = () => setTimeout(() => clearInterval(previewStatusTimer), 300000)
    const stopLiveTimer = () => setTimeout(() => clearInterval(liveStatusTimer), 300000)

    const onPreviewClick = useCallback(() => {
        setPreviewSpin(true);
        axios
            .post(url,
            { target: { ...target, ref_name: "staging" } },
                config
            )
            .then((response) => {
                previewStatusTimer = setInterval(() => {
                    checkPipelineStatus(response.data.uuid, (data) => {
                        clearInterval(previewStatusTimer);
                        setPreviewSpin(false);
                        setCompletePreviewStatus(data.state.result.name);
                    })
                }, 10000)
                stopPreviewTimer();
            })
            .catch((err) => setPreviewSpin(false))

    }, []);

    const onLiveClick = useCallback(() => {
        props.extension.dialogs.openConfirm({
            title: 'Push all changed entries to Live site?',
            message: 'Caution: check preview site first!',
            intent: 'negative',
            confirmLabel: 'Build the live site',
            cancelLabel: 'Cancel'
        }).then((isConfirm) => {
            if (isConfirm) {
                setLiveSpin(true);
                axios
                    .post(url,
                        {target: {...target, ref_name: "master"}},
                        config
                    )
                    .then((response) => {
                        liveStatusTimer = setInterval(() => {
                            checkPipelineStatus(response.data.uuid, (data) => {
                                clearInterval(liveStatusTimer);
                                setLiveSpin(false);
                                setCompleteLiveStatus(data.state.result.name);
                            })
                        }, 10000);
                        stopLiveTimer();
                    })
                    .catch((err) => setLiveSpin(false))
            }
        })

    }, []);

    const renderPreviewLabel = () => {
        switch (completePreviewStatus) {
            case null:
                return 'Build the preview site';
            case 'SUCCESSFUL':
                return <><Icon icon="InfoCircle" color="white" style={{ margin: '-3px 6px 0 0', verticalAlign: 'middle' }} />The preview site is built. Build it again?</>;
            case 'FAILED':
                return (
                    <>
                        <Icon icon="Warning" color="white" style={{ margin: '-3px 6px 0 0', verticalAlign: 'middle' }} />
                        <Tooltip content="Warning! The preview site building was failed. Build it again?">
                            Warning! The preview site building was failed. Build it again?
                        </Tooltip>
                    </>
                );
            case 'STOPPED':
            case 'PAUSED':
                return (
                    <>
                        <Icon icon="Warning" color="white" style={{ margin: '-3px 6px 0 0', verticalAlign: 'middle' }} />
                        <Tooltip content="Warning! The preview site building was stopped. Build it again?">
                            Warning! The preview site building was stopped. Build it again?
                        </Tooltip>
                    </>
                );
            default:
                return 'Build the preview site';
        }
    }

    const renderLiveLabel = () => {
        switch (completeLiveStatus) {
            case null:
                return 'Build the live site';
            case 'SUCCESSFUL':
                return <><Icon icon="InfoCircle" color="white" style={{ margin: '-3px 6px 0 0', verticalAlign: 'middle' }} />The live site is built. Build it again?</>;
            case 'FAILED':
                return (
                    <>
                        <Tooltip content="Warning! The live site building was failed. Build it again?">
                            Warning! The live site building was failed. Build it again?
                        </Tooltip>
                    </>
                );
            case 'STOPPED':
            case 'PAUSED':
                return (
                    <>
                        <Icon icon="Warning" color="white" style={{ margin: '-3px 6px 0 0', verticalAlign: 'middle' }} />
                        <Tooltip content="Warning! The live site building was stopped. Build it again?">
                            Warning! The live site building was stopped. Build it again?
                        </Tooltip>
                    </>
                );
            default:
                return 'Build the preview site';
        }
    }

    return (
        <>
            <Paragraph>
                <HelpText style={{ marginBottom: 10 }}>Push all changed entries to Preview site</HelpText>
                <Button
                    className="publish-button"
                    buttonType="positive"
                    isFullWidth
                    onClick={onPreviewClick}
                >
                    { isPreviewSpin ? (<><Spinner color="white" /> The preview site is building</>) : renderPreviewLabel() }
                </Button>
            </Paragraph>
            <Paragraph>
                <HelpText style={{ marginTop: 10, marginBottom: 10 }}>Push all changed entries to Live site</HelpText>
                <Button
                    className="publish-button"
                    buttonType="negative"
                    isFullWidth
                    onClick={onLiveClick}
                >
                    { isLiveSpin ? (<><Spinner color="white" /> The live site is building</>) : renderLiveLabel() }
                </Button>
            </Paragraph>
            <Paragraph>&nbsp;</Paragraph>
        </>
    );
}

init(extension => {
    ReactDOM.render(
        <Pipelines extension={extension} />,
        document.getElementById("root")
    )
});
