
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ExpectationSelectorProps {
  selectedExpectations: string[];
  onExpectationChange: (expectation: string, checked: boolean) => void;
}

const ExpectationSelector = ({ selectedExpectations, onExpectationChange }: ExpectationSelectorProps) => {
  const expectationOptions = [
    'Funding Support',
    'Mentorship',
    'Office Space',
    'Networking Opportunities',
    'Legal Support',
    'Marketing Support',
    'Technical Support',
    'Business Development'
  ];

  return (
    <div>
      <Label className="text-base font-medium">What do you expect from the incubation program? *</Label>
      <div className="grid grid-cols-2 gap-3 mt-3">
        {expectationOptions.map((expectation) => (
          <div key={expectation} className="flex items-center space-x-2">
            <Checkbox
              id={expectation}
              checked={selectedExpectations?.includes(expectation) || false}
              onCheckedChange={(checked) => onExpectationChange(expectation, checked as boolean)}
            />
            <Label htmlFor={expectation} className="text-sm font-normal">
              {expectation}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpectationSelector;
