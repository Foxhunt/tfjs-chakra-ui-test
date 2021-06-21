import { useEffect, useRef, useState } from "react";

// import * as tf from "@tensorflow/tfjs";
import { MobileNet } from "@tensorflow-models/mobilenet"
import { WebcamIterator } from "@tensorflow/tfjs-data/dist/iterators/webcam_iterator";

import { Container, Stack, HStack, Select, Box, Stat, StatLabel, StatNumber, Heading, Skeleton, Tag, AspectRatio } from "@chakra-ui/react"

export default function Home() {
  const webcamRef = useRef()
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceID, setSelectedDeviceID] = useState("")
  const [webcam, setWebcam] = useState<WebcamIterator>()
  const [mobileNet, setMobileNet] = useState<MobileNet>()
  const [results, setResults] = useState([])

  useEffect(() => {
    async function loadMobilenet() {
      const tf = (await import("@tensorflow/tfjs"))
      const mobilenet = (await import("@tensorflow-models/mobilenet"))
      const net = await mobilenet.load({ version: 2, alpha: 1 })
      setMobileNet(net)
    }
    loadMobilenet()
  }, [])

  useEffect(() => {
    async function getDevices() {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === "videoinput")
      setDevices(devices)
      setSelectedDeviceID(devices[0].deviceId)
    }
    getDevices()
  }, [])

  useEffect(() => {
    async function getCamera() {
      const tf = (await import("@tensorflow/tfjs"))
      const webcam = await tf.data.webcam(webcamRef.current, { deviceId: selectedDeviceID })
      const img = await webcam.capture()
      const mobileNetResults = await mobileNet.classify(img)
      img.dispose()
      setResults(mobileNetResults)
      setWebcam(webcam)
    }
    if (selectedDeviceID && mobileNet) {
      getCamera()
    }
  }, [mobileNet, selectedDeviceID])

  return <Container
    centerContent
    maxW="container.xl"
    pt="2">
    <Stack direction={["column", "row"]}>
      <Box>
        {/* video */}
        <AspectRatio>
          <video
            width="400px"
            height="400px"
            ref={webcamRef}
            onClick={async () => {
              if (webcam && mobileNet) {
                const img = await webcam.capture()
                const mobileNetResults = await mobileNet.classify(img)
                img.dispose()
                setResults(mobileNetResults)
              }
            }}
            autoPlay
            playsInline
            muted />
        </AspectRatio>
        {/* Ddvices */}
        <Select
          pt="2"
          bg="gray.50"
          onChange={e => {
            setSelectedDeviceID(e.target.value)
          }}>
          {devices.map(device =>
            <option
              value={device.deviceId}
              key={device.deviceId}>
              {device.label}
            </option>
          )}
        </Select>
      </Box>
      {/* results */}
      <Stack>
        <Heading>Results:</Heading>
        {results.map(({ className, probability }, index) =>
          <Skeleton
            key={index}
            isLoaded={className && probability}>
            <Box
              p="4"
              borderWidth="1px"
              borderRadius="lg"
              bg="gray.50">
              <Stat>
                <StatLabel>
                  <HStack>
                    {className.split(", ").map(name =>
                      <Tag
                        _hover={{
                          background: "blue.100",
                        }}
                        key={name}>
                        {name}
                      </Tag>)}
                  </HStack>
                </StatLabel>
                <StatNumber>
                  {probability}
                </StatNumber>
              </Stat>
            </Box>
          </Skeleton>
        )}
      </Stack>
    </Stack>
  </Container >
}
