import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverTrigger } from "./ui/popover";

export function Filter(label: string, id: string) {
  <Popover>
    <PopoverTrigger>
      <Label>{label}</Label>
      <Input id={id} />
    </PopoverTrigger>
  </Popover>;
}
