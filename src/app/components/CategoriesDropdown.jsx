import React from "react";
import categoriesWithSkills from "@/data/categoriesWithSkills";

const CategoriesDropdown = ({ onSkillClick }) => {
  return (
    <div
      className="absolute top-full left-0 bg-white shadow-lg rounded-lg 
                 p-8 grid grid-cols-5 gap-6 z-50 mt-2 
                 w-[910px] h-[448px] overflow-y-auto"
    >
      {Object.entries(categoriesWithSkills).map(([category, skills]) => (
        <div key={category}>
          <h3 className="font-bold mb-3 text-lg">{category}</h3>
          <ul className="space-y-2">
            {skills.map((skill) => (
              <li
                key={skill}
                className="hover:underline cursor-pointer"
                onClick={() => onSkillClick(category, skill)} // call parent handler
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default CategoriesDropdown;
