
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChallengesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const ChallengesField = ({ value, onChange }: ChallengesFieldProps) => {
  return (
    <div>
      <Label htmlFor="challenges">What challenges are you currently facing? (Optional)</Label>
      <Textarea
        id="challenges"
        placeholder="Tell us about any challenges you're facing in your startup journey..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </div>
  );
};

export default ChallengesField;
