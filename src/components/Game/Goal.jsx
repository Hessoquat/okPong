function Goal({size, depth, className, postWidth}) {
 return <div className={`${className} goal`} style={{
    height: `${size}%`,
    width: `${depth}%`,
    border: `${postWidth}vh solid #301510`
}} ></div>
}

export default Goal