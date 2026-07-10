import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

interface Props {
  connecting: boolean;
  onConnect: () => void;
}

export default function ConnectPage({ connecting, onConnect }: Props) {
  return (
    <Card className="mx-auto mt-16 max-w-md p-6">
      <h2 className="text-lg font-semibold">Connect your Drive</h2>
      <p className="mt-1 text-sm text-slate-500">
        Keyva keeps an encrypted vault in your Google Drive. Nothing leaves your
        device unencrypted.
      </p>
      <Button onClick={onConnect} disabled={connecting} className="mt-4 w-full">
        {connecting ? "Connecting…" : "Connect Google Drive"}
      </Button>
    </Card>
  );
}
