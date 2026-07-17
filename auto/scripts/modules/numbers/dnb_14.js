const MODULE_DNB_14 = {
  "id": "dnb_14",
  "num": 14,
  "title": "Lire une abscisse sur une droite graduée",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "import_dnb_zip",
  "has_svg": true,
  "questions": [
    {
      "n": 1,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"292","label":"0"},{"x":"350","label":"1"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,9,[4,5])\nval=i-4\ncx=60+i*58",
        "numberline_family": "standard"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 2,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"350","label":"0"},{"x":"408","label":"1"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,9,[5,6])\nval=i-5\ncx=60+i*58",
        "numberline_family": "standard"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 3,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"234","label":"-1"},{"x":"292","label":"0"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,9,[3,4])\nval=i-4\ncx=60+i*58",
        "numberline_family": "standard"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"60","label":"-5"},{"x":"350","label":"0"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,9,[0,5])\nval=i-5\ncx=60+i*58",
        "numberline_family": "signed"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 5,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"292","label":"0"},{"x":"408","label":"1"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,9,[4,6])\nval=CUT((i-4)*0.5,1)\ncx=60+i*58",
        "numberline_family": "fractional"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"118","label":"-1"},{"x":"350","label":"0"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,9,[1,5])\nval=CUT((i-5)*0.25,2)\ncx=60+i*58",
        "numberline_family": "fractional"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 7,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"60","label":"-10"},{"x":"350","label":"0"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,9,[0,5])\nval=(i-5)*2\ncx=60+i*58",
        "numberline_family": "signed"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Lis les abscisses des points A et B :\n" + numberLineSvg({"references":[{"x":"292","label":"0"},{"x":"350","label":"1"}],"points":[{"x":"${cxA}","label":"A"},{"x":"${cxB}","label":"B","color":"#7c3aed"}]}),
      "answer": "[\"va\",\"vb\"]",
      "options": {
        "formula_code": "setNB(1)\nia=RD(0,3)\nib=RD(5,9,[5])\nva=ia-4\nvb=ib-4\ncxA=60+ia*58\ncxB=60+ib*58",
        "numberline_family": "standard"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]] \\qquad 𝑥_B\\,=\\,[[formula]]$$"
    },
    {
      "n": 9,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"234","label":"-2"},{"x":"292","label":"-1"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,4,[3,4])\nval=i-5\ncx=60+i*58",
        "numberline_family": "signed"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 10,
      "statement": "Quelle est l'abscisse du point C ?\n" + numberLineSvg({"references":[{"x":"350","label":"0"},{"x":"408","label":"1"}],"points":[{"x":"${cx}","label":"C"}]}) + "&&$$${val}$$&&$$${opp}$$&&$$${d3}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\ni=RD(0,4)\nval=i-5\ncx=60+i*58\nopp=5-i\nd3=i-6",
        "shuffle_answers": true,
        "numberline_family": "standard"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 11,
      "statement": "Quelle est l'abscisse du point C ?\n" + numberLineSvg({"references":[{"x":"${zeroX}","label":"0"},{"x":"${oneX}","label":"1"}],"points":[{"x":"${cx}","label":"C"}]}) + "&&$$${val}$$&&$$${raw}$$&&$$${inverse}$$&&$$${opposite}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nz=RD(2,5)\ni=RD(0,9,[z,z+2])\nk=i-z\nval=CUT(k*0.5,1)\nraw=k\ninverse=k*2\nopposite=0-val\nzeroX=60+z*58\noneX=60+(z+2)*58\ncx=60+i*58",
        "shuffle_answers": true,
        "numberline_family": "fractional"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 12,
      "statement": "Quelle est l'abscisse du point C ?\n" + numberLineSvg({"references":[{"x":"${zeroX}","label":"0"},{"x":"${oneX}","label":"1"}],"points":[{"x":"${cx}","label":"C"}]}) + "&&$$${val}$$&&$$${raw}$$&&$$${inverse}$$&&$$${opposite}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nz=RD(1,5)\ni=RD(0,9,[z,z+4])\nk=i-z\nval=CUT(k*0.25,2)\nraw=k\ninverse=k*4\nopposite=0-val\nzeroX=60+z*58\noneX=60+(z+4)*58\ncx=60+i*58",
        "shuffle_answers": true,
        "numberline_family": "fractional"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 13,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"${refX1}","label":"${refV1}"},{"x":"${refX2}","label":"${refV2}"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\nstep=RD(1,2)\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\ndir=RD(0,1)===0?-1:1\nzeroI=dir===1?refI1:refI2\nrefV1=(refI1-zeroI)*step\nrefV2=(refI2-zeroI)*step\ni=RD(0,9,[refI1,refI2])\nval=(i-zeroI)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58",
        "numberline_family": "scaled"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 14,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"${refX1}","label":"${refV1}"},{"x":"${refX2}","label":"${refV2}"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\nstep=5\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=RD(-4,2)*step\nrefV2=refV1+gap*step\ni=RD(0,9,[refI1,refI2])\nval=refV1+(i-refI1)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58",
        "numberline_family": "scaled"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 15,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"${refX1}","label":"${refV1}"},{"x":"${refX2}","label":"${refV2}"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\nsteps=[10,20,25,50]\nstep=steps[RD(0,3)]\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=RD(-3,1)*step\nrefV2=refV1+gap*step\ni=RD(0,9,[refI1,refI2])\nval=refV1+(i-refI1)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58",
        "numberline_family": "scaled"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 16,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"${refX1}","label":"${refV1}"},{"x":"${refX2}","label":"${refV2}"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\nsteps=[0.1,0.2]\nstep=steps[RD(0,1)]\ngap=RD(2,5)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=CUT(RD(-4,1)*step,2)\nrefV2=CUT(refV1+gap*step,2)\ni=RD(0,9,[refI1,refI2])\nval=CUT(refV1+(i-refI1)*step,2)\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58",
        "numberline_family": "fractional"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 17,
      "statement": "Lis l'abscisse du point A :\n" + numberLineSvg({"references":[{"x":"${refX1}","label":"${refV1}"},{"x":"${refX2}","label":"${refV2}"}],"points":[{"x":"${cx}","label":"A"}]}),
      "answer": "[\"val\"]",
      "options": {
        "formula_code": "setNB(1)\nsteps=[1,2,5,10]\nstep=steps[RD(0,3)]\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\ndo{refV1=RD(-5,3)*step\nrefV2=refV1+gap*step}while(refV1===0||refV2===0)\ni=RD(0,9,[refI1,refI2])\nval=refV1+(i-refI1)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58",
        "numberline_family": "scaled"
      },
      "footer": "$$𝑥_A\\,=\\,[[formula]]$$"
    },
    {
      "n": 18,
      "statement": "Quelle est l'abscisse du point C ?\n" + numberLineSvg({"references":[{"x":"${refX1}","label":"${refV1}"},{"x":"${refX2}","label":"${refV2}"}],"points":[{"x":"${cx}","label":"C"}]}) + "&&$$${val}$$&&$$${raw}$$&&$$${offByOne}$$&&$$${opposite}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nsteps=[0.1,0.2,0.5,2,5,10,20,25]\ndo{step=steps[RD(0,7)]\ngap=RD(2,5)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=CUT(RD(-4,2)*step,2)\nrefV2=CUT(refV1+gap*step,2)\ni=RD(0,9,[refI1,refI2])\nval=CUT(refV1+(i-refI1)*step,2)\nraw=CUT(refV1+(i-refI1),2)\noffByOne=CUT(refV1+((i-refI1)+(i>refI1?1:-1))*step,2)\nopposite=0-val}while(val===0||raw===val||offByOne===val||opposite===val||raw===offByOne||raw===opposite||offByOne===opposite)\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58",
        "shuffle_answers": true,
        "numberline_family": "scaled"
      },
      "footer": "[[formula_qcm1]]"
    }
  ]
};
