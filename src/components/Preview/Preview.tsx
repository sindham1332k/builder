import * as React from 'react'
import { DropTarget } from 'react-dnd'
import Lottie from 'react-lottie'
import { env } from 'decentraland-commons'

import { PreviewType } from 'modules/editor/types'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { ASSET_TYPE } from 'components/AssetCard/AssetCard.dnd'
import { convertToUnityKeyboardEvent } from 'modules/editor/utils'
import { previewTarget, collect, CollectedProps } from './Preview.dnd'
import { EditorWindow, Props, State } from './Preview.types'
import animationData from './loader.json'
import './Preview.css'

const editorWindow = window as EditorWindow
const unityDebugParams = env.get('REACT_APP_UNITY_DEBUG_PARAMS')

let canvas: HTMLCanvasElement | null = null
let isDCLInitialized: boolean = false

class Preview extends React.Component<Props & CollectedProps, State> {
  canvasContainer = React.createRef<HTMLDivElement>()

  componentDidMount() {
    if (unityDebugParams) {
      history.replaceState('', 'Unity Debug', `?${unityDebugParams}`)
    }

    if (!isDCLInitialized) {
      this.startEditor().catch(error => console.error('Failed to start editor', error))
    } else {
      this.moveCanvas()
      this.openEditor()
      this.subscribeKeyDownEvent()
    }
  }

  componentWillUnmount() {
    if (canvas) {
      document.getElementsByTagName('body')[0].appendChild(canvas)
    }
    this.unsubscribeKeyDownEvent()
  }

  moveCanvas = () => {
    if (this.canvasContainer.current && canvas) {
      this.canvasContainer.current.appendChild(canvas)
    }
  }

  subscribeKeyDownEvent = () => {
    editorWindow.addEventListener('keydown', this.handleKeyDownEvent)
  }

  unsubscribeKeyDownEvent = () => {
    editorWindow.removeEventListener('keydown', this.handleKeyDownEvent)
  }

  handleKeyDownEvent(e: KeyboardEvent) {
    const unityEvt = convertToUnityKeyboardEvent(e)
    if (unityEvt) {
      editorWindow.editor.onKeyDown(unityEvt)
    }
  }

  openEditor = () => {
    const { isReadOnly, type } = this.props
    this.props.onOpenEditor({ isReadOnly: isReadOnly === true, type: type || PreviewType.PROJECT })
  }

  async startEditor() {
    if (!this.canvasContainer.current) {
      throw new Error('Missing canvas container')
    }
    try {
      isDCLInitialized = true
      ;(window as any).devicePixelRatio = 1 // without this unity blows up majestically 💥🌈🦄🔥🤷🏼‍♂️
      await editorWindow.editor.initEngine(this.canvasContainer.current, '/unity/Build/unity.json')
      if (!unityDebugParams) {
        canvas = await editorWindow.editor.getDCLCanvas()
        canvas && canvas.classList.add('dcl-canvas')
      }

      this.moveCanvas()
      this.openEditor()

      this.subscribeKeyDownEvent()
    } catch (error) {
      isDCLInitialized = false
      console.error('Failed to load Preview', error)
    }
  }

  getLoadingText(): string {
    const { isLoadingEditor, isLoadingBaseWearables } = this.props
    if (isLoadingBaseWearables && isLoadingEditor) {
      return t('editor_preview.loading_unity_and_base_wearables')
    } else if (isLoadingBaseWearables && !isLoadingEditor) {
      return t('editor_preview.loading_base_wearables')
    } else {
      return t('editor_preview.loading_unity')
    }
  }

  render() {
    const { isLoadingEditor, connectDropTarget, isLoadingBaseWearables } = this.props
    const isLoadingResources = isLoadingEditor || isLoadingBaseWearables

    return connectDropTarget(
      <div className="Preview-wrapper">
        {isLoadingResources && (
          <div className="overlay">
            <Lottie
              height={100}
              width={100}
              options={{
                loop: true,
                autoplay: true,
                animationData: animationData,
                rendererSettings: {
                  preserveAspectRatio: 'xMidYMid slice'
                }
              }}
            />
            <div id="progress-bar" className="progress ingame">
              <div className="full"></div>
            </div>
            <div className="loading-text">{this.getLoadingText()}</div>
          </div>
        )}
        <div className={`Preview ${isLoadingResources ? 'loading' : ''}`} id="preview-viewport" ref={this.canvasContainer} />
      </div>
    )
  }
}

export default DropTarget<Props, CollectedProps>(ASSET_TYPE, previewTarget, collect)(Preview)
