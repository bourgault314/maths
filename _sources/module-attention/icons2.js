const React=require('react');const RDS=require('react-dom/server');const sharp=require('sharp');
const fa=require('react-icons/fa');
const list={bell:fa.FaBell,cloud:fa.FaCloud,mobile:fa.FaMobileAlt,ear:fa.FaAssistiveListeningSystems,eyeslash:fa.FaEyeSlash,one:fa.FaHandPointUp,film:fa.FaFilm,redo:fa.FaRedo,list:fa.FaListUl};
(async()=>{for(const [n,I] of Object.entries(list)){for(const [suf,col] of [['',"#1D2B4F"],['_w',"#FFFFFF"]]){
 const svg=RDS.renderToStaticMarkup(React.createElement(I,{size:256,color:col}));
 await sharp(Buffer.from(svg)).resize(256,256).png().toFile(`img/ic_${n}${suf}.png`);}}console.log('icons ok')})();
