import {RefObject, useEffect, useRef, useState} from 'react';

type StatusType = "idle" | "recording" | "paused"

const useScreenRecorder = () => {
  const [status,setStatus] = useState<StatusType>("idle")
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [blobUrl, setBlobUrl] = useState('')
  const [blob, setBlob] = useState<Blob|null>(null)

  const videoRef = useRef() as RefObject<HTMLVideoElement>

  // streaming to videoRef
  useEffect(()=>{
    if(stream && videoRef.current && status === "recording") videoRef.current.srcObject = stream
  },[stream, status])
  
  
  const startRecording = async () => {
    if(status !== "idle") return

    try {
      const videoStream = await navigator.mediaDevices.getDisplayMedia()
      setStream(videoStream)

      const mediaRecorder = new MediaRecorder(videoStream)
      setRecorder(mediaRecorder)

      // when starting
      mediaRecorder.onstart = () => {
        if(videoRef.current) videoRef.current.play()
      }

      // when resuming
      mediaRecorder.onresume = () => {
        if(videoRef.current) videoRef.current.play()
      }

      // when pausing
      mediaRecorder.onpause = () => {
        if(videoRef.current) videoRef.current.pause()
      }

      const chunks: Blob[] = []
      // when recording
      mediaRecorder.ondataavailable = (e)=>{
        if(e.data.size > 0) chunks.push(e.data)
      }
      
      // when stopping
      mediaRecorder.onstop = async () => {
        const completeBlob = new Blob(chunks,{type:"video/webm"})
        setBlob(completeBlob)

        const videoUrl = URL.createObjectURL(completeBlob)
        setBlobUrl(videoUrl)

        if(videoRef.current){
          videoRef.current.srcObject = null
          videoRef.current.src = videoUrl
          videoRef.current.play()
        }
      }
      
      mediaRecorder.start()
      setStatus("recording")

    } catch (error) {
      console.error("Error getting the stream")
    }
  }

  const stopRecording = () => {
    if(recorder && status !== "idle"){
      recorder.stop()
      recorder.stream.getTracks().map((track)=>track.stop())
      setRecorder(null)
      setStream(null)
      setStatus("idle")
    }
  }

  const pauseRecording = () => { 
    if(recorder && status === "recording"){
      recorder.pause()
      setStatus('paused')
    }
  }
  
  const resumeRecording = () => { 
    if(recorder && status === "paused"){
      recorder.resume()
      setStatus('recording')
    }
  }

  return{
    blob,
    blobUrl,
    status,
    videoRef,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  }
}

export default useScreenRecorder