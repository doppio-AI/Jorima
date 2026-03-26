import React from "react";

interface MoodSelectorProps {
  selectedMood: string;
  onSelect: (mood: string) => void;
}

const moods = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"];

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelect }) => {
  return (
    <div className="mood-selector">
      {moods.map((mood) => (
        <div
          key={mood}
          className={`mood-option ${selectedMood === mood ? "selected" : ""}`}
          onClick={() => onSelect(mood)}
        >
          {mood}
        </div>
      ))}
    </div>
  );
};

export default MoodSelector;
