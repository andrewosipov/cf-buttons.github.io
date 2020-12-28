import React from "react"
import ReactDOM from "react-dom"
import {
    SectionHeading,
    Paragraph,
    Icon
} from "@contentful/forma-36-react-components"
import "@contentful/forma-36-react-components/dist/styles.css"
import "@contentful/forma-36-fcss/dist/styles.css"
import { init } from "contentful-ui-extensions-sdk"

const Pipelines = () => {
    return (<button>Run</button>)
}

init(extension => {
    ReactDOM.render(
        <App extension={extension} />,
        document.getElementById("root")
    )
})
