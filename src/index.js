import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Button, Paragraph, HelpText, Spinner, Icon } from '@contentful/forma-36-react-components';
import { init } from 'contentful-ui-extensions-sdk';
import axios from 'axios';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import './index.css';

class App extends React.Component {
    constructor(props) {
        super(props)

        // Trigger update method to setup initial state
        this.state = this.constructState()

        console.log('start')
    }

    componentDidMount = () => {
        this.detachFns = []

        // Update component state when a field value changes
        const fields = this.props.extension.entry.fields
        for (let key in fields) {
            this.detachFns.push(fields[key].onValueChanged(this.onUpdate))
        }

        // Pull content types. We'll need them to find out display fields
        this.props.extension.space.getContentTypes().then(allContentTypes => {
            const displayFieldsMap = {}
            allContentTypes.items.forEach(ct => {
                displayFieldsMap[ct.sys.id] = ct.displayField
            })

            this.setState({
                displayFieldsMap
            })
        })

        // Listen sys changes
        this.detachFns.push(this.props.extension.entry.onSysChanged(this.onUpdate))
    }

    componentWillUnmount = () => {
        this.detachFns.forEach(detach => detach())
    }

    constructState = () => {
        const sys = this.props.extension.entry.getSys()

        return {
            working: false,
            isDraft: !sys.publishedVersion,
            hasPendingChanges: sys.version > (sys.publishedVersion || 0) + 1,
            isPublished: sys.version === (sys.publishedVersion || 0) + 1
        }
    }

    onError = error => {
        this.setState({ working: false })
        this.props.extension.notifier.error(error.message)
    }

    onUpdate = () => {
        this.setState(this.constructState())
    }

    unpublishedReferences = entry => {
        const referenceFieldNames = []
        const entryReferenceIds = []

        for (let name in entry.fields) {
            let locale = this.props.extension.locales.default
            if (
                entry.fields[name][locale].sys &&
                entry.fields[name][locale].sys.type === "Link" &&
                entry.fields[name][locale].sys.linkType === "Entry"
            ) {
                referenceFieldNames.push(name)
                entryReferenceIds.push(entry.fields[name][locale].sys.id)
            }
        }

        return this.props.extension.space
            .getEntries({
                "sys.id[in]": entryReferenceIds.join(",")
            })
            .then(referenceEntries => {
                return referenceEntries.items
                    .filter(entry => !entry.sys.publishedVersion)
                    .map((entry, ind) => ({
                        field: referenceFieldNames[ind],
                        entry
                    }))
            })
    }

    getLinkedAndPublishedEntries = entry => {
        return this.props.extension.space
            .getEntries({ links_to_entry: entry.sys.id })
            .then(linkedEntries =>
                linkedEntries.items.filter(entry => !!entry.sys.publishedVersion)
            )
    }

    getEntryDisplayFieldValue = entry => {
        // It's possible for an Entry not to have a display field defined
        const displayField = this.state.displayFieldsMap[entry.sys.contentType.sys.id];

        return displayField
            ? entry.fields[displayField][this.props.extension.locales.default]
            : entry.sys.id;
    };

    onClickUnpublish = async () => {
        // this.setState({ working: true })
        //
        // const ext = this.props.extension
        // const sys = ext.entry.getSys()
        //
        // const entry = await ext.space.getEntry(sys.id)
        // const linkedAndPublishedEntries = await this.getLinkedAndPublishedEntries(entry)
        //
        // let title = "Unpublish entry?"
        // let message =
        //     "This entry will be unpublished and will not be available on your website or app anymore."
        // let confirmLabel = "Unpublish"
        //
        // if (linkedAndPublishedEntries.length > 0) {
        //     title = "Entry is linked in other entries"
        //     confirmLabel = "Unpublish anyway"
        //     message =
        //         `There are ${
        //             linkedAndPublishedEntries.length
        //         } entries that link to this entry: ` +
        //         linkedAndPublishedEntries
        //             .map(this.getEntryDisplayFieldValue)
        //             .join(", ")
        // }
        //
        // const result = await this.props.extension.dialogs
        //     .openConfirm({
        //         title,
        //         message,
        //         confirmLabel,
        //         cancelLabel: "Cancel"
        //     })
        //
        // if (!result) {
        //     this.setState({ working: false })
        //     return
        // }
        //
        // try {
        //     await ext.space.unpublishEntry(entry)
        //     this.onUpdate()
        // } catch (error) {
        //     this.onError(error)
        // }
    }

    onClickPublish = async () => {
        // this.setState({ working: true })
        //
        // const ext = this.props.extension
        // const sys = ext.entry.getSys()
        //
        // const entry = await ext.space.getEntry(sys.id)
        // const unpublishedReferences = await this.unpublishedReferences(entry)
        //
        // let title = "Publish entry?"
        // let message =
        //     "This entry will be published and become available on your website or app."
        // let confirmLabel = "Publish"
        //
        // if (unpublishedReferences.length > 0) {
        //     title = "You have unpublished links"
        //     message =
        //         "Not all links on this entry are published. See sections: " +
        //         unpublishedReferences.map(ref => ref.field).join(", ")
        //     confirmLabel = "Publish anyway"
        // }
        //
        // const result = await this.props.extension.dialogs
        //     .openConfirm({
        //         title,
        //         message,
        //         confirmLabel,
        //         cancelLabel: "Cancel"
        //     })
        //
        // if (!result) {
        //     this.setState({ working: false })
        //     return
        // }
        //
        // try {
        //     await ext.space.publishEntry(entry)
        //     this.onUpdate()
        // } catch (error) {
        //     this.onError(error)
        // }
    }

    renderStatusLabel = () => {
        if (this.state.isPublished) {
            return "Published"
        }

        if (this.state.isDraft) {
            return "Draft"
        }

        return "Published (pending changes)"
    }

    render = () => {

        return (
            <>
                <Paragraph className="f36-margin-bottom--s">
                    <strong>Pipelines</strong>
                </Paragraph>
                <Button
                    className="publish-button"
                    buttonType="positive"
                    isFullWidth={true}
                    onClick={this.onClickPublish}
                    disabled={this.state.isPublished || this.state.working}
                    loading={this.state.working}
                >
                    Build preview
                </Button>
            </>
        )
    }
}

const url = 'https://api.bitbucket.org/2.0/repositories/musicfirstdevteam/musicfirst-com/pipelines/';
const target = {
    ref_type: "branch",
    type: "pipeline_ref_target"
};
const config = {
    headers: {
        Accept: 'application/json',
        Authorization: 'Basic bWFpbEBhbmRyZXctb3NpcG92LnBybzpwIzByVW1AMTE='
    }
};

const Pipelines = (props) => {
    const [isPreviewSpin, setPreviewSpin] = useState(false);
    const [isLiveSpin, setLiveSpin] = useState(false);
    const [previewStatusTimer, setPreviewStatusTimer] = useState(0);
    const [liveStatusTimer, setLiveStatusTimer] = useState(0);
    const [completePreviewTime, setCompletePreviewTime] = useState(null);
    const [completeLiveTime, setCompleteLiveTime] = useState(null);

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
                setPreviewStatusTimer(setInterval(() => {
                    checkPipelineStatus(response.data.uuid, (data) => {
                        setPreviewSpin(false);
                        setCompletePreviewTime(new Date(data.completed_on));
                    })
                }, 10000))
                stopPreviewTimer();
            })
            .catch((err) => setPreviewSpin(false))

    }, []);

    const onLiveClick = useCallback(() => {
        setLiveSpin(true);
        axios
            .post(url,
            { target: { ...target, ref_name: "master" } },
                config
            )
        .then((resp) => {
            setLiveStatusTimer(setInterval(() => {
                checkPipelineStatus(response.data.uuid, (data) => {
                    setLiveSpin(false);
                    setCompleteLiveTime(new Date(data.completed_on));
                })
            }, 10000));
            stopLiveTimer();
        })
        .catch((err) => setLiveSpin(false))

    }, []);

    const renderPreviewLabel = () => completePreviewTime === null
        ? 'Build the preview site'
        : <><Icon icon="InfoCircle" color="white" style={{ margin: '-3px 6px 0 0', verticalAlign: 'middle' }} />The preview site is built. Build it again?</>
    const renderLiveLabel = () => completeLiveTime === null
        ? 'Build the live site'
        : <><Icon icon="InfoCircle" color="white" style={{ margin: '-3px 6px 0 0', verticalAlign: 'middle' }} />The live site is built. Build it again?</>

    console.log(props);
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
                    { isPreviewSpin ? <Spinner color="white" /> : renderPreviewLabel() }
                </Button>
            </Paragraph>
            <Paragraph>
                <HelpText style={{ marginTop: 10, marginBottom: 10 }}>Push all changed entries to Live site. <br />Caution: check preview site first!</HelpText>
                <Button
                    className="publish-button"
                    buttonType="negative"
                    isFullWidth
                    onClick={onLiveClick}
                >
                    { isLiveSpin ? <Spinner color="white" /> : renderLiveLabel() }
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
