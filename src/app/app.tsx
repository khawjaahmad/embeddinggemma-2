import { Gate } from "@/app/gate"
import { Workspace } from "@/app/shell"
import { EngineProvider, useEngine } from "@/embedder/engine-context"

function Body() {
  const { status } = useEngine()
  return status === "ready" ? <Workspace /> : <Gate />
}

function App() {
  return (
    <EngineProvider>
      <Body />
    </EngineProvider>
  )
}

export default App
