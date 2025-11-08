import React from "react";
import categoriesWithSkills from "@/data/categoriesWithSkills";

const CategoriesDropdown = ({ onSkillClick }) => {
  return (
    <div
      className="fixed top-[120px] left-[260px] bg-white shadow-2xl rounded-xl
                 p-8 grid grid-cols-5 gap-6 z-[9999] mt-2 
                 w-[910px] h-[448px] overflow-y-auto border border-gray-200"
    >
      {Object.entries(categoriesWithSkills).map(([category, skills]) => (
        <div key={category}>
          <h3 className="font-bold mb-3 text-lg">{category}</h3>
          <ul className="space-y-2">
            {skills.map((skill) => (
              <li
                key={skill}
                className="hover:underline cursor-pointer"
                onClick={() => onSkillClick(category, skill)}
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
