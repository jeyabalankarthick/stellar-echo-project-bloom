
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface IdeaDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const IdeaDescriptionField = ({ value, onChange }: IdeaDescriptionFieldProps) => {
  return (
    <div>
      <Label htmlFor="ideaDescription">Describe your startup idea *</Label>
      <Textarea
        id="ideaDescription"
        placeholder="Tell us about your startup idea, the problem you're solving, and your solution..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        required
      />
    </div>
  );
};

export default IdeaDescriptionField;
