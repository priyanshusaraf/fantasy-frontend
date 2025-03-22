import { SKILL_LEVELS } from "@/utils/constants";

// ... inside the component ...
<div className="space-y-2">
  <Label htmlFor="skillLevel">Skill Level (Optional)</Label>
  <Select 
    value={formData.skillLevel || ""} 
    onValueChange={(value) => setFormData({...formData, skillLevel: value})}
  >
    <SelectTrigger id="skillLevel">
      <SelectValue placeholder="Select skill level" />
    </SelectTrigger>
    <SelectContent>
      {SKILL_LEVELS.map((level) => (
        <SelectItem key={level.value} value={level.value}>
          {level.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div> 